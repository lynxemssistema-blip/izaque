import dotenv from 'dotenv';
dotenv.config();

const BACKEND_URL = 'http://localhost:3001';

async function testOrchestrator() {
  console.log('🧪 [Test] Testando Orquestrador Dinâmico Multi-Agente do Santuário IZAQUE...\n');

  // Teste 1: Questão Bíblica / Fé / Aflição da Alma (Deve rotear para o Pastor João e citar JFA)
  console.log('1️⃣ Teste de Intenção Bíblica / Fé / Espiritualidade:');
  const biblicalPayload = {
    message: 'Tenho passado por dias de muita aflição e ansiedade, sentindo que não tenho forças para continuar. O que a Bíblia e Deus dizem para acalmar meu coração nessa hora difícil?',
    userId: 'c29d5a94-d53b-4623-9110-89b2a37ed6e8',
    agentId: 'auto',
  };

  try {
    const res = await fetch(`${BACKEND_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(biblicalPayload),
    });

    const data = await res.json();
    console.log(`✅ Especialista selecionado: "${data.agentUsed?.name}" (${data.agentUsed?.slug})`);
    console.log(`📖 Trechos de estudo bíblico aplicados: ${data.knowledgeUsed?.length || 0}`);
    console.log(`💬 Resposta gerada:\n${data.reply}\n`);

    if (data.agentUsed?.slug !== 'pastor-joao-biblico') {
      console.error('❌ Falha: Esperava pastor-joao-biblico, mas recebeu:', data.agentUsed?.slug);
    } else {
      console.log('🎉 Roteamento para Pastor João validado com sucesso!');
    }
  } catch (err) {
    console.error('❌ Erro no teste bíblico:', err);
  }

  // Teste 2: Questão Financeira (Deve rotear para o Dr. Marcus)
  console.log('\n2️⃣ Teste de Intenção Financeira / Dinheiro:');
  const financePayload = {
    message: 'Tenho muito medo de aumentar o preço da minha consultoria e perder clientes, sinto uma culpa enorme em cobrar caro.',
    userId: 'c29d5a94-d53b-4623-9110-89b2a37ed6e8',
    agentId: 'auto',
  };

  try {
    const res = await fetch(`${BACKEND_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(financePayload),
    });

    const data = await res.json();
    console.log(`✅ Especialista selecionado: "${data.agentUsed?.name}" (${data.agentUsed?.slug})`);
    if (data.agentUsed?.slug === 'mentor-financeiro') {
      console.log('🎉 Roteamento para Dr. Marcus validado com sucesso!');
    }
  } catch (err) {
    console.error('❌ Erro no teste financeiro:', err);
  }

  // Teste 3: Questão de Liderança (Deve rotear para a Helena Vance)
  console.log('\n3️⃣ Teste de Intenção de Liderança / Delegação:');
  const leadershipPayload = {
    message: 'Não consigo delegar tarefas para a minha equipe, acabo centralizando tudo e trabalhando até tarde.',
    userId: 'c29d5a94-d53b-4623-9110-89b2a37ed6e8',
    agentId: 'auto',
  };

  try {
    const res = await fetch(`${BACKEND_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(leadershipPayload),
    });

    const data = await res.json();
    console.log(`✅ Especialista selecionado: "${data.agentUsed?.name}" (${data.agentUsed?.slug})`);
    if (data.agentUsed?.slug === 'mentora-lideranca') {
      console.log('🎉 Roteamento para Helena Vance validado com sucesso!');
    }
  } catch (err) {
    console.error('❌ Erro no teste de liderança:', err);
  }
}

testOrchestrator()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
