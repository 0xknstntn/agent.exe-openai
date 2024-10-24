import dotenv from 'dotenv';
import OpenAI from 'openai';

dotenv.config();


export const openai_client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // This is the default and can be omitted
});