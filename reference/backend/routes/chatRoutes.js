import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

const router = express.Router();

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

router.post('/', async (req, res) => {
  const { message, history } = req.body;

  try {
    // FIX: "gemini-flash-latest" is the stable alias that appeared in your allowed list.
    // It typically has the highest rate limits (15 RPM) for free tier users.
    const model = genAI.getGenerativeModel({
      model: 'gemini-flash-latest',
      systemInstruction:
        "You are Nevan, a warm and caring virtual assistant for 'Nevan Handicraft'. We sell handmade, organic products for babies and mothers. Your tone should be gentle, helpful, and trustworthy. Keep answers concise.",
    });

    const chat = model.startChat({
      history: history || [],
    });

    const result = await chat.sendMessage(message);
    const response = await result.response;
    const text = response.text();

    res.json({ reply: text });
  } catch (error) {
    console.error('AI Error:', error);

    // FIX 2: Specific handling for Rate Limits (429)
    if (error.response && error.response.status === 429) {
      return res.json({
        reply:
          "I'm receiving too many messages right now and need a quick break. Please ask me again in a minute!",
      });
    }

    res.json({
      reply:
        "I'm having a little trouble connecting right now. Please try again in a moment!",
    });
  }
});

export default router;
