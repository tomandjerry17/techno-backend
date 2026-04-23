require('dotenv').config();
const express = require('express');
const cors = require('cors');
const detectRoute = require('./routes/detect');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
}));

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