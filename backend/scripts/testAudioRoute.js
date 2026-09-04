import dotenv from 'dotenv';
dotenv.config();

// Gera um pequeno buffer simulado de áudio em base64 (cabeçalho webm silencioso)
// Para testar o endpoint /api/chat/audio
const sampleAudioBase64 = Buffer.from([
  0x1a, 0x45, 0xdf, 0xa3, 0x9f, 0x42, 0x86, 0x81, 0x01, 0x42, 0xf7, 0x81, 0x01, 0x42, 0xf2, 0x81,
  0x04, 0x42, 0xf3, 0x81, 0x08, 0x42, 0x82, 0x84, 0x77, 0x65, 0x62, 0x6d, 0x42, 0x87, 0x81, 0x04
]).toString('base64');

async function testAudioRoute() {
  console.log('🧪 Testando endpoint POST /api/chat/audio com histórico de boas-vindas...');

  const payload = {
    audioBase64: sampleAudioBase64,
    mimeType: 'audio/webm',
    userId: 'c29d5a94-d53b-4623-9110-89b2a37ed6e8',
    agentId: 'auto',
    durationSeconds: 3,
    // Simula o histórico que causava o erro: primeiro item era 'assistant' / 'model'
    history: [
      {
        role: 'assistant',
        content: 'Olá. Respire fundo e sinta-se em paz. O que tem pesado na sua mente?',
      }
    ],
  };

  try {
    const res = await fetch('http://localhost:3001/api/chat/audio', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    console.log('Status HTTP:', res.status);
    const data = await res.json();
    console.log('Resposta do Servidor:', JSON.stringify(data, null, 2));

    if (res.status === 200) {
      console.log('🎉 SUCESSO! Rota de áudio tratou o histórico e respondeu normalmente sem erro 500.');
    } else {
      console.error('❌ Falha:', data);
    }
  } catch (err) {
    console.error('❌ Erro na requisição:', err);
  }
}

testAudioRoute();
