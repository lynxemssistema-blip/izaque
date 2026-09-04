import dotenv from 'dotenv';
dotenv.config();

async function testVoiceEndpoint() {
  console.log('🧪 Testando endpoint POST /api/voice com limpeza de markdown e cache...');

  const rawText = `Olá... **Respire fundo** e sinta o peso saindo dos seus ombros. 🌿
  
  Muitas vezes você sente que precisa dar conta de tudo... mas hoje, permita-se descansar um instante.
  
  * O que podemos fazer nas próximas 24 horas?`;

  const payload = {
    text: rawText,
    messageId: 'test_msg_1',
  };

  // 1ª Chamada: Geração e upload no Supabase Storage
  console.log('1️⃣ Enviando requisição de síntese de voz (1ª vez)...');
  const res1 = await fetch('http://localhost:3001/api/voice', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  console.log('Status HTTP:', res1.status);
  const data1 = await res1.json();
  console.log('Resposta 1:', data1);

  if (res1.status === 200 && data1.audioUrl) {
    console.log('✅ 1ª Chamada gerou áudio com sucesso! URL:', data1.audioUrl);
  } else {
    console.error('❌ Falha na 1ª chamada:', data1);
    return;
  }

  // 2ª Chamada: Deve retornar diretamente do CACHE do Supabase Storage
  console.log('\n2️⃣ Testando Cache do Supabase Storage (2ª chamada com o mesmo texto)...');
  const res2 = await fetch('http://localhost:3001/api/voice', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const data2 = await res2.json();
  console.log('Resposta 2:', data2);

  if (data2.fromCache === true) {
    console.log('🎉 SUCESSO ABSOLUTO: Cache no Supabase Storage ativado e funcionando com economia de custos!');
  } else {
    console.log('Aviso: fromCache retornou', data2.fromCache);
  }
}

testVoiceEndpoint().catch(console.error);
