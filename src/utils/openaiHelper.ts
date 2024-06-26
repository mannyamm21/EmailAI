import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Function to analyze email content
export async function analyzeEmailContent(content: string): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'You are an email classifier.' },
        { role: 'user', content: `Classify the following email content:\n${content}\nCategories: Interested, Not Interested, More information.` },
      ],
      max_tokens: 100,
    });

    return response.choices[0]?.message?.content?.trim() || 'Uncategorized';
  } catch (error) {
    console.error('Error analyzing email content:', error);
    return 'Uncategorized';
  }
}

// Function to generate a reply based on the category
export async function generateReply(category: string): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'You are an email reply generator.' },
        { role: 'user', content: `Generate a reply for an email categorized as "${category}".` },
      ],
      max_tokens: 150,
    });

    return response.choices[0]?.message?.content?.trim() || 'No reply generated.';
  } catch (error) {
    console.error('Error generating reply:', error);
    return 'No reply generated.';
  }
}
