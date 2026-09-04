import { genAI, CHAT_MODEL } from '../src/config/gemini.js';
import { supabaseAdmin } from '../src/config/supabase.js';
import { generateEmbedding, searchMemories, formatMemoriesForPrompt } from '../src/services/memoryService.js';

const userId = 'c29d5a94-d53b-4623-9110-89b2a37ed6e8'; // Edson Manoel (Super Admin)

async function testFullMentorChat() {
  console.log('🗣️ Testando resposta do Mentor IZAQUE com injeção de memórias RAG...\n');

  const userMessage = 'Izaque, estou exausto. Fico trabalhando até tarde porque sinto que se eu não fizer tudo com as minhas próprias mãos, a empresa quebra.';

  // 1. Embedding + RAG
  const queryEmbedding = await generateEmbedding(userMessage);
  const memories = await searchMemories(userId, queryEmbedding, { matchThreshold: 0.40, matchCount: 3 });
  const memoriesContext = formatMemoriesForPrompt(memories);

  console.log(`Memórias recuperadas para o contexto: ${memories.length}`);

  // 2. Prompt do IZAQUE
  const { data: agent } = await supabaseAdmin.from('izaque_agents').select('system_prompt').eq('slug', 'izaque-master').single();

  const fullPrompt = `${agent.system_prompt}\n\n${memoriesContext}`;

  const model = genAI.getGenerativeModel({
    model: CHAT_MODEL,
    systemInstruction: fullPrompt,
    generationConfig: { temperature: 0.7 },
  });

  const chat = model.startChat();
  const result = await chat.sendMessage(userMessage);

  console.log('\n--- RESPOSTA DO MENTOR IZAQUE ---');
  console.log(result.response.text());
  console.log('---------------------------------\n');
}

testFullMentorChat();
