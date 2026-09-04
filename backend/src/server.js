import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import chatRoutes from './routes/chatRoutes.js';
import adminRoutes from './routes/adminRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.resolve(__dirname, '../../frontend/dist');

// Middlewares de Segurança e Logging
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({
  origin: process.env.CORS_ORIGIN === '*' ? '*' : process.env.CORS_ORIGIN?.split(','),
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ limit: '25mb', extended: true }));
app.use(morgan('dev'));

// Health check para monitoramento na VPS
const healthHandler = (req, res) => {
  res.status(200).json({
    status: 'online',
    service: 'IZAQUE API - Backend Orchestrator',
    timestamp: new Date().toISOString(),
  });
};
app.get('/health', healthHandler);
app.get('/api/health', healthHandler);

// Rotas da API
app.use('/api', chatRoutes);
app.use('/api', adminRoutes);

// Servir frontend compilado em produção se o diretório dist existir
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path === '/health') return next();
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// Fallback para rotas de API inexistentes
app.use((req, res) => {
  res.status(404).json({ error: 'Rota não encontrada no servidor IZAQUE API.' });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('🔥 [Unhandled Error]', err);
  res.status(500).json({ error: 'Erro interno no servidor IZAQUE API.' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`====================================================`);
  console.log(`🚀 [IZAQUE API] Servidor ativo na porta ${PORT}`);
  console.log(`🧠 [RAG Memory] Pronto para gerenciar memórias com Supabase e Gemini`);
  console.log(`📡 [Health Check] Acesse http://localhost:${PORT}/health`);
  console.log(`🌐 [Modo] ${process.env.NODE_ENV || 'development'}`);
  console.log(`====================================================`);
});
