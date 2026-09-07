import pg from 'pg';

const client = new pg.Client({
  host: 'db.ohjuqcrpakswvnoqobiq.supabase.co',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: '10207597Rdv*',
  ssl: { rejectUnauthorized: false }
});

async function run() {
  try {
    await client.connect();
    console.log('✅ Conectado ao Supabase PostgreSQL');

    // 1. Adicionar coluna starter_questions se não existir
    console.log('⏳ 1. Adicionando coluna starter_questions em public.izaque_agents...');
    await client.query(`
      ALTER TABLE public.izaque_agents
        ADD COLUMN IF NOT EXISTS starter_questions JSONB DEFAULT '[]'::jsonb;
    `);

    // 2. Perguntas padrão para o Mentor de Sobriedade (Renato)
    const renatoQuestions = JSON.stringify([
      { id: 'q1', text: 'Como identificar e desarmar o gatilho da fissura quando a vontade de beber vier forte hoje?', category: 'Manejo de Fissura' },
      { id: 'q2', text: 'Tive um deslize e tomei um gole. Como lidar com a culpa e não deixar isso virar uma recaída total?', category: 'Prevenção de Recaída' },
      { id: 'q3', text: 'Como aprender a dizer "não" em festas, churrascos e encontros de amigos sem me sentir isolado?', category: 'Situações Sociais' },
      { id: 'q4', text: 'O que fazer naqueles momentos de solidão ou ansiedade à noite onde a bebida parecia ser a única saída?', category: 'Gatilhos Emocionais' },
      { id: 'q5', text: 'Quais são as instituições e grupos gratuitos de apoio no Brasil (A.A., CAPS ad, CVV) e como eles funcionam?', category: 'Rede de Apoio' }
    ]);

    // 3. Perguntas padrão para IZAQUE Master
    const izaqueQuestions = JSON.stringify([
      { id: 'q1', text: 'Por que eu sinto que fico procrastinando justamente as decisões que mais transformariam minha vida?', category: 'Autossabotagem' },
      { id: 'q2', text: 'Como desatar o nó da hesitação e do medo constante do julgamento alheio?', category: 'Clareza Emocional' },
      { id: 'q3', text: 'Qual é a crença oculta que me faz achar que nunca estou pronto o suficiente para começar?', category: 'Crenças Limitantes' },
      { id: 'q4', text: 'Como construir uma constância inabalável mesmo nos dias em que a motivação desaparece?', category: 'Foco & Disciplina' }
    ]);

    // 4. Perguntas padrão para Pastor João (Bíblico)
    const pastorQuestions = JSON.stringify([
      { id: 'q1', text: 'Pastor, meu coração está ansioso e sobrecarregado. O que as Escrituras ensinam para acalmar a alma?', category: 'Ansiedade & Paz' },
      { id: 'q2', text: 'Como confiar nos planos de Deus quando tudo ao redor parece desmoronar?', category: 'Fé & Confiança' },
      { id: 'q3', text: 'Sinto um peso de culpa por erros passados. O que a Bíblia ensina sobre o perdão e a graça redentora?', category: 'Graça & Perdão' },
      { id: 'q4', text: 'Qual palavra das Sagradas Escrituras pode sustentar minhas batalhas desta semana?', category: 'Direção Diária' }
    ]);

    // 5. Perguntas padrão para Dr. Marcus (Financeiro)
    const marcusQuestions = JSON.stringify([
      { id: 'q1', text: 'Por que eu sinto desconforto ou culpa quando começo a cobrar mais caro ou a lucrar alto?', category: 'Crença de Escassez' },
      { id: 'q2', text: 'Como perder o medo de negociar e valorizar financeiramente o meu tempo e trabalho?', category: 'Autoestima Financeira' },
      { id: 'q3', text: 'Qual padrão financeiro herdado da minha família ainda trava o meu crescimento?', category: 'Herança Familiar' }
    ]);

    // 6. Perguntas padrão para Helena Vance (Liderança)
    const helenaQuestions = JSON.stringify([
      { id: 'q1', text: 'Como parar de ser o gargalo da minha equipe e aprender a delegar sem a ansiedade de querer controlar tudo?', category: 'Delegação' },
      { id: 'q2', text: 'Como dar feedbacks corretivos firmes sem parecer agressivo nem passar a mão na cabeça?', category: 'Comunicação' },
      { id: 'q3', text: 'Como sair do operacional sufocante para assumir verdadeiramente minha postura estratégica de líder?', category: 'Visão Estratégica' }
    ]);

    console.log('⏳ 2. Atualizando starter_questions nos agentes...');
    await client.query(`UPDATE public.izaque_agents SET starter_questions = $1::jsonb WHERE slug = 'renato-sobriedade'`, [renatoQuestions]);
    await client.query(`UPDATE public.izaque_agents SET starter_questions = $1::jsonb WHERE slug = 'izaque-master'`, [izaqueQuestions]);
    await client.query(`UPDATE public.izaque_agents SET starter_questions = $1::jsonb WHERE slug = 'pastor-joao-biblico'`, [pastorQuestions]);
    await client.query(`UPDATE public.izaque_agents SET starter_questions = $1::jsonb WHERE slug = 'mentor-financeiro'`, [marcusQuestions]);
    await client.query(`UPDATE public.izaque_agents SET starter_questions = $1::jsonb WHERE slug = 'mentora-lideranca'`, [helenaQuestions]);

    console.log('✅ Migração de perguntas prontas concluída com sucesso!');
  } catch (err) {
    console.error('❌ Erro na migração de perguntas:', err);
  } finally {
    await client.end();
  }
}

run();
