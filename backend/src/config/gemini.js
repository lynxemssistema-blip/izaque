import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.error('====================================================');
  console.error('❌ [FATAL] GEMINI_API_KEY não foi configurada!');
  console.error('📝 Configure a variável de ambiente no painel do Easypanel/VPS.');
  console.error('====================================================');
}

export const genAI = new GoogleGenerativeAI(apiKey || 'placeholder');

export const CHAT_MODEL = process.env.GEMINI_CHAT_MODEL || 'gemini-2.0-flash';
export const EMBEDDING_MODEL = process.env.GEMINI_EMBEDDING_MODEL || 'text-embedding-004';
