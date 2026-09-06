import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Tenta carregar o .env de múltiplos locais (funciona em dev com nodemon, Docker e VPS)
const envCandidates = [
  path.resolve(__dirname, '../../.env'),    // relativo a src/config/ → backend/.env
  path.resolve(process.cwd(), '.env'),       // CWD (nodemon executa em backend/)
  path.resolve(process.cwd(), 'backend/.env'), // CWD na raiz do projeto
];
for (const envPath of envCandidates) {
  if (fs.existsSync(envPath)) { dotenv.config({ path: envPath }); break; }
}

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('====================================================');
  console.error('❌ [FATAL] SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórias!');
  console.error('📝 Configure as variáveis de ambiente no painel do Easypanel/VPS.');
  console.error('====================================================');
  // Não encerramos o processo aqui para que o servidor suba e o health check
  // possa responder mesmo sem conexão ao banco, facilitando o diagnóstico.
}

// Criação do client com a Service Role Key (privilegiada, apenas no backend Hermes)
export const supabaseAdmin = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseServiceKey || 'placeholder_key',
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);
