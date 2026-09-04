import { genAI, CHAT_MODEL } from '../config/gemini.js';
import { saveMemory } from './memoryService.js';

/**
 * Analisa a interação de forma assíncrona em background para extrair aprendizados duradouros.
 * Se o usuário revelou um bloqueio, crença, trauma ou meta, resume e salva na tabela izaque_user_memories.
 * 
 * @param {string} userId ID do usuário
 * @param {string} userMessage Mensagem enviada pelo usuário
 * @param {string} assistantReply Resposta fornecida pelo mentor
 */
export async function extractAndSaveMemoryAsync(userId, userMessage, assistantReply = '') {
  // Dispara a execução sem esperar, garantindo zero impacto na latência do usuário
  setImmediate(async () => {
    try {
      // Ignora mensagens muito curtas ou triviais (ex: 'ok', 'oi', 'valeu')
      if (!userMessage || userMessage.trim().length < 12) {
        return;
      }

      const extractionPrompt = `
Você é um observador psicológico do sistema "IZAQUE".
Sua tarefa é analisar a fala do usuário e determinar se ele revelou um FATO DE LONGO PRAZO crucial sobre sua mentalidade.

Critérios para extrair:
- Bloqueio emocional ou trauma citado
- Crença limitante (ex: "não consigo cobrar bem", "sempre desisto no final")
- Padrão de autossabotagem ou procrastinação
- Relacionamento disfuncional ou gatilho de ansiedade/medo
- Meta profunda ou compromisso transformacional assumido

NÃO EXTRAIA:
- Perguntas genéricas ou rotineiras
- Cumprimentos ou conversas banais
- Opiniões passageiras sem peso psicológico

Entrada do Usuário: "${userMessage}"
Contexto da Resposta do Mentor: "${assistantReply.slice(0, 300)}"

Retorne EXCLUSIVAMENTE um objeto JSON válido no seguinte formato:
{
  "shouldStore": true ou false,
  "category": "blocker" | "belief" | "pattern" | "goal" | "trauma",
  "content": "Resumo sintético em 1 frase na 3ª pessoa. Ex: 'Possui medo de expor ideias em público por receio de julgamento da família.'",
  "importanceScore": número de 1 a 5 (5 sendo um bloqueio central gravíssimo)
}
Se nada relevante foi revelado, retorne apenas: {"shouldStore": false}
`;

      const model = genAI.getGenerativeModel({
        model: CHAT_MODEL,
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.1, // Baixa temperatura para extração determinística
        },
      });

      const result = await model.generateContent(extractionPrompt);
      const responseText = result.response.text();
      
      let parsed;
      try {
        parsed = JSON.parse(responseText);
      } catch (parseError) {
        console.warn('⚠️ [Memory Extraction] Falha ao parsear JSON da extração:', responseText);
        return;
      }

      if (parsed.shouldStore && parsed.content && parsed.content.trim().length > 5) {
        console.log(`💡 [Memory Extraction] Fato psicológico identificado: "${parsed.content}"`);
        await saveMemory({
          userId,
          content: parsed.content,
          category: parsed.category || 'blocker',
          importanceScore: parsed.importanceScore || 3,
        });
      }
    } catch (err) {
      console.error('⚠️ [Memory Extraction] Erro durante o processo de extração em background:', err.message);
    }
  });
}
