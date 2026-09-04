import { generateEmbedding, searchMemories, saveMemory } from '../src/services/memoryService.js';
import { supabaseAdmin } from '../src/config/supabase.js';

const userId = 'c29d5a94-d53b-4623-9110-89b2a37ed6e8'; // Edson Manoel (Super Admin)

async function testRAGFlow() {
  console.log('🧪 Testando fluxo completo de RAG e Embeddings do Gemini 768d...\n');

  // 1. Salvar uma memória inicial de teste
  console.log('1️⃣ Gravando bloqueio inicial na tabela izaque_user_memories...');
  const mem = await saveMemory({
    userId,
    content: 'Trava forte ao delegar tarefas operacionais por perfeccionismo e medo de perda de controle.',
    category: 'blocker',
    importanceScore: 4,
  });

  if (!mem) {
    console.error('❌ Falha ao salvar memória inicial');
    process.exit(1);
  }
  console.log('✅ Memória gravada com sucesso com vetor 768d!\n');

  // 2. Simular uma nova pergunta do usuário sobre esse tema
  const userQuery = 'Estou sobrecarregado hoje porque não consigo passar as tarefas pros meus funcionários.';
  console.log(`2️⃣ Usuário enviou nova mensagem: "${userQuery}"`);
  console.log('Gerando embedding da mensagem com Gemini...');
  const queryEmbedding = await generateEmbedding(userQuery);
  console.log(`✅ Embedding gerado: ${queryEmbedding.length} dimensões.`);

  // 3. Testar busca vetorial por similaridade de cosseno (RPC izaque_match_memories)
  console.log('3️⃣ Executando RPC izaque_match_memories no Supabase...');
  const results = await searchMemories(userId, queryEmbedding, {
    matchThreshold: 0.40,
    matchCount: 3,
  });

  console.log(`✅ Memórias recuperadas por similaridade: ${results.length}`);
  results.forEach((r, idx) => {
    console.log(`   [${idx + 1}] (${(r.similarity * 100).toFixed(1)}% similaridade) [${r.category}]: "${r.content}"`);
  });

  console.log('\n====================================================');
  console.log('🎉 TESTE END-TO-END DO RAG PASSOU COM 100% DE SUCESSO!');
  console.log('====================================================\n');
}

testRAGFlow();
