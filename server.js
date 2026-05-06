require('dotenv').config();
const express = require('express');
const detectRoute = require('./routes/detect');

const app = express();
const PORT = process.env.PORT || 3000;

app.use((req, res, next) => {
  const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    'https://agrivision-beta.vercel.app',
  ];
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

app.use(express.json());

app.use('/api', detectRoute);

app.get('/', (req, res) => {
  res.json({ status: 'AgriVision backend is running ✅' });
});

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.message);
  res.status(500).json({ error: 'Something went wrong on the server.' });
});

app.listen(PORT, () => {
  console.log(`\n🌿 AgriVision Backend running at http://localhost:${PORT}`);
  console.log(`   Groq key loaded: ${process.env.GROQ_API_KEY ? '✅ YES' : '❌ NOT FOUND — check your .env'}\n`);
});