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

    const prompt = `You are an expert plant pathologist AI. Analyze this plant leaf image and respond ONLY with a valid JSON object — no markdown, no backticks, no explanation outside the JSON.

Use this exact structure:
{
  "disease_name": "Name of the disease, or 'Healthy' if no disease is found",
  "confidence_level": "High / Medium / Low",
  "symptoms_observed": "Brief description of visible symptoms in the image",
  "recommended_treatment": "Specific treatment steps for this disease",
  "preventive_measures": "How to prevent this disease in the future"
}

If the image is not a plant leaf, respond with:
{
  "disease_name": "Not a plant image",
  "confidence_level": "High",
  "symptoms_observed": "The uploaded image does not appear to be a plant leaf.",
  "recommended_treatment": "Please upload a clear photo of a plant leaf.",
  "preventive_measures": "N/A"
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
      max_tokens: 1024,
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