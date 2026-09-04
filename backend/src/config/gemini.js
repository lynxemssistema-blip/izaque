import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.warn('⚠️ [Gemini] GEMINI_API_KEY não foi configurada no arquivo .env');
}

export const genAI = new GoogleGenerativeAI(apiKey);

export const CHAT_MODEL = process.env.GEMINI_CHAT_MODEL || 'gemini-3.6-flash';
export const EMBEDDING_MODEL = process.env.GEMINI_EMBEDDING_MODEL || 'gemini-embedding-001';
