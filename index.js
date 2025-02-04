// index.js
import { Telegraf } from 'telegraf';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
import express from 'express';

// Load environment variables
dotenv.config();

// Create a bot instance using the token from environment variables
const bot = new Telegraf(process.env.BOT_TOKEN);

// Initialize Express app
const app = express();

// Add a simple route for health checks
app.get('/', (req, res) => {
  res.send('Bot is running');
});

// Middleware to parse JSON requests
app.use(express.json());

// Handle incoming messages
bot.on('text', (ctx) => {
  const text = ctx.message.text;
  if (!text) {
    return ctx.reply("Please provide some text.");
  }

  handleResponse(ctx, text);
});

// Function to handle API responses using Google API
const handleResponse = async (ctx, prompt) => {
  const apiKey = process.env.GOOGLE_API_KEY; // Use your Google API key from env variables
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`;

  const requestBody = {
    contents: [
      {
        parts: [
          { text: prompt }
        ]
      }
    ]
  };

  try {
    ctx.replyWithChatAction('typing');

    // Making the API request to the Google endpoint
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    // Check if the response is ok
    if (!response.ok) {
      const errorData = await response.json(); // Get the response body for error details
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorData.error.message}`);
    }

    const data = await response.json();

    // Debugging: Log the entire response structure to analyze it
    console.log('API Response:', JSON.stringify(data, null, 2));

    // Extract the response text from the candidates array
    const result = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!result) {
      throw new Error('No valid response from the Google API');
    }

    await ctx.reply(result);
  } catch (error) {
    console.error('Error from the Google API:', error);
    await ctx.reply(`An error occurred while processing your request: ${error.message}`);
  }
};

// Start the bot
bot.launch().then(() => {
  console.log('Bot is running!');
}).catch(err => {
  console.error('Error launching the bot:', err);
});

// Start the Express server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});