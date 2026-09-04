import dotenv from 'dotenv';
dotenv.config();
import { processChatMessageCore } from '../src/controllers/chatController.js';

async function testCoreHistory() {
  console.log('🧪 Testando processChatMessageCore com o histórico que causava o erro...');

  const result = await processChatMessageCore({
    message: 'Então, meu bom, eu tenho me sentido assim cansado, estafado.',
    userId: 'c29d5a94-d53b-4623-9110-89b2a37ed6e8',
    agentId: 'auto',
    // Histórico problemático com role model / assistant como primeiro item
    history: [
      {
        role: 'assistant',
        content: 'Olá. Respire fundo e sinta-se em paz. O que tem pesado na sua mente?',
      }
    ],
  });

  console.log('✅ Resposta gerada pelo mentor:');
  console.log('Mentor:', result.selectedAgent.name);
  console.log('Resposta:', result.reply);
  console.log('🎉 HISTÓRICO SANITIZADO E EXECUTADO COM SUCESSO!');
}

testCoreHistory().catch(console.error);
