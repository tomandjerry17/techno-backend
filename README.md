# 🌿 AgriVision — Backend

Minimal Express backend for AI-powered plant disease detection. Receives a plant leaf image from the frontend, sends it to Groq's vision AI, and returns a structured diagnosis in plain, farmer-friendly language.

**Live API:** [https://techno-backend-1b0v.onrender.com](https://techno-backend-1b0v.onrender.com)  
**Frontend:** [https://agrivision-beta.vercel.app](https://agrivision-beta.vercel.app)

---

## ⚙️ Tech Stack

| Tool | Purpose |
|---|---|
| Node.js + Express | Server framework |
| Multer | Image upload handling (memory storage) |
| Groq SDK | AI vision inference |
| dotenv | Environment variable management |

---

## 📁 Project Structure

```
techno-backend/
├── routes/
│   └── detect.js   ← POST /api/detect (core detection route)
├── server.js        ← Entry point, CORS, middleware setup
├── .env             ← Your secret keys (never commit this)
├── .env.example     ← Template for required environment variables
├── .gitignore
└── package.json
```

---

## 🔁 How It Works

```
Frontend → POST /api/detect (multipart image)
         → Multer stores image in memory (no disk, no cloud)
         → Image sent to Groq as base64
         → Groq (Llama 4 Scout vision model) analyzes the leaf
         → Structured JSON result returned to frontend
```

**Response shape:**
```json
{
  "result": {
    "disease_name": "Early Blight",
    "confidence_level": "High",
    "symptoms_observed": "Brown spots with rings on lower leaves.",
    "what_to_do_now": ["Remove affected leaves", "Avoid watering leaves directly"],
    "what_to_buy": ["Dithane M-45 — available at most agri-stores"],
    "what_to_tell_the_store": "I need a fungicide for early blight on my tomato plants.",
    "preventive_measures": ["Rotate crops each season", "Water at the base only"]
  }
}
```

---

## 🚀 Local Setup

### Prerequisites
- Node.js v18 or higher
- A free Groq API key (see Step 1)

### Steps

**Step 1 — Get a free Groq API key**
1. Go to [https://console.groq.com](https://console.groq.com)
2. Sign up or log in
3. Go to **API Keys** → **Create API key**
4. Copy the key

**Step 2 — Clone the repository**
```bash
git clone https://github.com/tomandjerry17/techno-backend.git
cd techno-backend
```

**Step 3 — Create your `.env` file**
```bash
cp .env.example .env
```

Open `.env` and paste your key:
```
GROQ_API_KEY=your_groq_api_key_here
PORT=3000
```

**Step 4 — Install dependencies**
```bash
npm install
```

**Step 5 — Start the server**
```bash
node server.js
```

You should see:
```
🌿 AgriVision Backend running at http://localhost:3000
   Groq key loaded: ✅ YES
```

---

## 🌐 Deployment (Render)

This backend is deployed on **Render** (free tier).

### To deploy your own instance:

1. Push this repo to GitHub
2. Go to [https://render.com](https://render.com) and sign in with GitHub
3. Click **New → Web Service** and connect the repo
4. Set these configuration values:

| Field | Value |
|---|---|
| Runtime | Node |
| Build Command | `npm install` |
| Start Command | `node server.js` |
| Instance Type | Free |
| Region | Singapore |

5. Under **Environment Variables**, add:

```
GROQ_API_KEY = your_groq_api_key_here
PORT = 3000
```

6. Click **Deploy** — Render will build and go live in ~2 minutes.

---

## 📡 API Reference

### `POST /api/detect`

Detects plant disease from an uploaded image.

**Request:**
- Content-Type: `multipart/form-data`
- Field name: `image`
- Accepted types: `image/jpeg`, `image/png`, `image/webp`
- Max size: 10MB

**Success Response — `200 OK`:**
```json
{
  "result": {
    "disease_name": "string",
    "confidence_level": "High | Medium | Low",
    "symptoms_observed": "string",
    "what_to_do_now": ["string"],
    "what_to_buy": ["string"],
    "what_to_tell_the_store": "string",
    "preventive_measures": ["string"]
  }
}
```

**Error Responses:**

| Status | Meaning |
|---|---|
| 400 | No image uploaded |
| 429 | Groq rate limit exceeded — wait and retry |
| 500 | Server or AI error |
| 502 | AI returned unexpected format |

---

### `GET /`

Health check endpoint.

**Response:**
```json
{ "status": "AgriVision backend is running ✅" }
```

---

## 🆓 Groq Free Tier Limits

| Limit | Amount |
|---|---|
| Requests per minute | 30 |
| Requests per day | 14,400 |
| Cost | Free |

More than enough for demos and prototypes.

---

## ⚠️ Notes

- **Never commit your `.env` file.** It is listed in `.gitignore` by default.
- Each team member who clones this repo needs to create their **own `.env`** with their own Groq key.
- The Render free tier **spins down after 15 minutes of inactivity**. The first request after sleep takes 30–50 seconds — just wait before the demo.
- Image data is processed **in memory only** — nothing is saved to disk or any cloud storage.