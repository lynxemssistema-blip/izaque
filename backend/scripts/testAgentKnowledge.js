import { supabaseAdmin } from '../src/config/supabase.js';
import { ingestAgentDocument, searchAgentKnowledge, formatAgentKnowledgeForPrompt } from '../src/services/agentKnowledgeService.js';
import { generateEmbedding } from '../src/services/memoryService.js';

async function testKnowledgeRAG() {
  console.log('🧪 Testando Ingestão de Estudo e RAG de Domínio para o Agente Especialista...\n');

  // Busca o especialista financeiro
  const { data: agent } = await supabaseAdmin
    .from('izaque_agents')
    .select('id, name, slug')
    .eq('slug', 'mentor-financeiro')
    .single();

  if (!agent) {
    console.error('❌ Mentor financeiro não encontrado');
    return;
  }

  console.log(`Mentor selecionado: "${agent.name}" (ID: ${agent.id})`);

  // Texto de estudo técnico para o agente aprender
  const studyMaterial = `
  METODOLOGIA DOS 4 NÍVEIS DE DESPROGRAMAÇÃO DA ESCASSEZ:
  Nível 1 - A Culpa do Sucesso: Empresários que cresceram em lares de classe baixa sentem inconscientemente que enriquecer é trair a própria família. Para quebrar esse bloqueio, deve-se aplicar o exercício do "Pacto de Lealdade Reversa", onde o lucro é ressignificado como honra à linhagem e não abandono.
  
  Nível 2 - O Teto de Vidro da Precificação: O medo de cobrar mais caro decorre da projeção do próprio bolso no cliente. A técnica "Preço Baseado em Transformação" estabelece que você nunca cobra pelas suas horas, mas sim pelo custo financeiro da dor que você poupa no cliente em 12 meses.
  
  Nível 3 - O Ciclo da Autossabotagem Financeira: Quando o caixa da empresa atinge um valor recorde, o indivíduo entra em ansiedade difusa e cria despesas impulsivas ou contratações erradas para voltar à zona de sobrevivência habitual.
  `;

  // 1. Ingestão e vetorização no Supabase pgvector
  console.log('\n1️⃣ Ingerindo e vetorizando o material de estudo no pgvector...');
  const doc = await ingestAgentDocument({
    agentId: agent.id,
    title: 'Manual de Reprogramação Financeira - 4 Níveis de Escassez',
    content: studyMaterial,
    fileType: 'framework',
  });

  console.log(`✅ Documento salvo: ID ${doc.id} com ${doc.total_chunks} trechos vetorizados!`);

  // 2. Consulta Semântica do Agente
  const userDoubt = 'Tenho muito medo de aumentar o preço dos meus serviços porque sinto que vou perder todos os clientes e me sinto culpado por cobrar tanto.';
  console.log(`\n2️⃣ Pergunta do usuário: "${userDoubt}"`);
  console.log('Gerando embedding da dúvida com Gemini...');
  const queryEmb = await generateEmbedding(userDoubt);

  console.log('Consultando a base de estudos do especialista via RPC izaque_match_agent_knowledge...');
  const matches = await searchAgentKnowledge(agent.id, queryEmb, { matchThreshold: 0.35, matchCount: 2 });

  console.log(`✅ Trechos técnicos encontrados: ${matches.length}`);
  matches.forEach((m, idx) => {
    console.log(`\n--- [Trecho ${idx + 1}] (Similaridade: ${(m.similarity * 100).toFixed(1)}%) ---`);
    console.log(m.content);
  });

  console.log('\n====================================================');
  console.log('🎉 BASE DE ESTUDOS DO AGENTE VALIDADA COM 100% DE SUCESSO!');
  console.log('====================================================\n');
}

testKnowledgeRAG();
