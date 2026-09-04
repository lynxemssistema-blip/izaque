import { genAI, CHAT_MODEL } from '../config/gemini.js';

/**
 * Transcreve um áudio enviado pelo usuário usando a capacidade multimodal do Gemini
 * @param {string} audioBase64 Dados do áudio em base64
 * @param {string} mimeType Tipo MIME do áudio (ex: 'audio/webm', 'audio/mp4', 'audio/wav')
 * @returns {Promise<string>} Texto transcrito
 */
export async function transcribeAudioWithGemini(audioBase64, mimeType = 'audio/webm') {
  try {
    const model = genAI.getGenerativeModel({
      model: CHAT_MODEL,
      generationConfig: {
        temperature: 0.1,
      },
    });

    const audioPart = {
      inlineData: {
        data: audioBase64,
        mimeType: mimeType.split(';')[0], // Limpa parâmetros adicionais do MIME
      },
    };

    const prompt = `
Você é o transcritor de áudio do sistema "IZAQUE".
Sua função é ouvir atentamente este áudio em português e transcrever com máxima precisão palavra por palavra o desabafo ou pergunta do usuário.

REGRAS:
- Retorne EXCLUSIVAMENTE o texto transcrito.
- Não adicione introduções, explicações, comentários ou aspas (ex: NUNCA diga "Aqui está a transcrição:").
- Se o áudio for inaudível ou não contiver fala humana perceptível, retorne apenas: "[Áudio inaudível]".
`;

    const result = await model.generateContent([prompt, audioPart]);
    const transcription = result.response.text().trim();

    console.log(`🎙️ [Audio Transcription] Transcrição concluída (${transcription.length} caracteres): "${transcription.slice(0, 60)}..."`);
    return transcription;
  } catch (error) {
    console.error('❌ Erro na transcrição de áudio com Gemini:', error);
    throw new Error(`Falha ao transcrever áudio: ${error.message}`);
  }
}
