const express = require('express');
const multer = require('multer');
const Groq = require('groq-sdk');
const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed.'));
    }
  },
});

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

router.post('/detect', upload.single('image'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No image uploaded.' });
  }

  if (!process.env.GROQ_API_KEY) {
    return res.status(500).json({ error: 'GROQ_API_KEY is not set in .env file.' });
  }

  try {
    const base64Image = req.file.buffer.toString('base64');
    const mimeType = req.file.mimetype;

    const prompt = `You are a friendly plant disease expert helping Filipino farmers who are not scientists. Analyze this plant leaf image and respond ONLY with a valid JSON object — no markdown, no backticks, no extra text outside the JSON.

Use simple everyday words. Write like you are giving advice to a neighbor farmer. Avoid scientific or chemical names — use brand names or descriptions that can be found in Philippine agri-supply stores (like CropLife, Bayer, Benomyl, Dithane M-45, Karate, Agrimycin, etc.).

Use this exact JSON structure:
{
  "disease_name": "Common name of the disease in simple words, or 'Healthy' if no disease found",
  "confidence_level": "High / Medium / Low",
  "symptoms_observed": "1 to 2 simple sentences describing what you see in the image, like explaining to a neighbor",
  "what_to_do_now": [
    "Step 1 as a simple tip",
    "Step 2 as a simple tip",
    "Step 3 as a simple tip",
    "Step 4 as a simple tip"
  ],
  "what_to_buy": [
    "Product 1 — short description of what it does and where to find it in the Philippines",
    "Product 2 — short description"
  ],
  "what_to_tell_the_store": "One simple sentence in English that the farmer can say to the agri-store staff to buy the right product",
  "preventive_measures": [
    "Prevention tip 1 in simple words",
    "Prevention tip 2 in simple words",
    "Prevention tip 3 in simple words"
  ]
}

Rules:
- what_to_do_now must be an array of 3 to 5 short tips, starting with home remedies before sprays
- what_to_buy must be an array of 1 to 3 products available in Philippine agri-stores
- preventive_measures must be an array of 3 to 5 short tips
- All tips must be short, clear, and actionable — one sentence each
- Do not use the words "chlorothalonil", "mancozeb", or other hard chemical names — use brand names or simple descriptions instead

If the image is not a plant leaf, respond with:
{
  "disease_name": "Not a plant image",
  "confidence_level": "High",
  "symptoms_observed": "The uploaded image does not appear to be a plant leaf.",
  "what_to_do_now": ["Please take a clear photo of a plant leaf and try again."],
  "what_to_buy": [],
  "what_to_tell_the_store": "N/A",
  "preventive_measures": []
}`;

    const response = await groq.chat.completions.create({
      model: 'meta-llama/llama-4-scout-17b-16e-instruct',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: {
                url: `data:${mimeType};base64,${base64Image}`,
              },
            },
            {
              type: 'text',
              text: prompt,
            },
          ],
        },
      ],
      max_tokens: 1500,
    });

    const rawText = response.choices[0]?.message?.content?.trim();

    let parsed;
    try {
      const cleaned = rawText.replace(/```json|```/g, '').trim();
      parsed = JSON.parse(cleaned);
    } catch {
      console.error('Groq returned non-JSON:', rawText);
      return res.status(502).json({
        error: 'AI returned an unexpected format. Please try again.',
      });
    }

    return res.status(200).json({ result: parsed });

  } catch (err) {
    console.error('Detection error:', err.message);

    if (err.message?.includes('429') || err.message?.includes('quota')) {
      return res.status(429).json({
        error: 'Too many requests. Please wait a moment and try again.',
      });
    }

    if (err.message?.includes('401') || err.message?.includes('API_KEY')) {
      return res.status(401).json({
        error: 'Invalid Groq API key. Please check your .env file.',
      });
    }

    return res.status(500).json({ error: 'Detection failed. Please try again.' });
  }
});

module.exports = router;