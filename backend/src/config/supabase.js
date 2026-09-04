import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

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
