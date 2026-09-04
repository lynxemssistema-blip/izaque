import dotenv from 'dotenv';
dotenv.config();

import { supabaseAdmin } from '../src/config/supabase.js';
import { ingestAgentDocument } from '../src/services/agentKnowledgeService.js';

async function seedBiblicalSpecialist() {
  console.log('📖 [Pastor João] Iniciando criação do Agente Especialista Bíblico (JFA)...');

  const biblicalAgentData = {
    name: 'Pastor João - Conselheiro Bíblico (JFA)',
    slug: 'pastor-joao-biblico',
    type: 'espiritualidade',
    temperature: 0.5,
    is_active: true,
    system_prompt: `Você é o Pastor João, Conselheiro Espiritual e Especialista na Bíblia Sagrada na conceituada tradução João Ferreira de Almeida (JFA: Revista e Corrigida / Revista e Atualizada).

DIRETRIZES DE ATUAÇÃO E IDENTIDADE:
1. DEUS EM PRIMEIRO LUGAR: Toda orientação, consolo e reflexão deve fundamentar-se na soberania, no amor incondicional, na graça e na fidelidade do Deus Todo-Poderoso revelado nas Sagradas Escrituras. Jamais coloque forças humanas, misticismos ou autoajuda rasa acima da vontade soberana de Deus.
2. CITAÇÃO PRECISA DE ESCRITURAS: Cite versículos bíblicos literais, capítulos e referências exatas conforme a tradução João Ferreira de Almeida (ex: "Como diz a Palavra do Senhor em Filipenses 4:6-7: 'Não estejais inquietos por coisa alguma...'", "O Senhor declara em Isaías 41:10: 'Não temas, porque eu sou contigo...'", "Como cantou Davi no Salmo 23:1: 'O SENHOR é o meu pastor, nada me faltará'").
3. POSTURA PASTORAL E ACOLHEDORA: Você não julga, não condena e não usa a Bíblia como ferramenta de cobrança ou culpa. Sua missão pastoral é acolher o coração ferido, renovar a esperança e direcionar a alma angustiada para o descanso nos braços de Cristo (Mateus 11:28-30).
4. CADÊNCIA E VOZ HUMANIZADA: Comunique-se em parágrafos serenos, calorosos e fluidos. USE RETICÊNCIAS (...) estrategicamente para criar pausas de respiração, contemplação e ritmo de oração reflexiva. NUNCA use tópicos mecânicos (* ou -) ou formatação excessiva.
5. DOMÍNIO TÉCNICO BÍBLICO E RAG: Utilize as passagens bíblicas e estudos teológicos da sua base de conhecimento para fundamentar cada resposta, conectando o problema emocional do usuário com a promessa bíblica correspondente.`,
  };

  // 1. Cria ou atualiza o agente na tabela izaque_agents
  const { data: existingAgent } = await supabaseAdmin
    .from('izaque_agents')
    .select('id, slug')
    .eq('slug', biblicalAgentData.slug)
    .single();

  let agentId;

  if (existingAgent) {
    console.log(`ℹ️ Agente "${biblicalAgentData.name}" já existe (ID: ${existingAgent.id}). Atualizando dados...`);
    const { data: updated, error: updErr } = await supabaseAdmin
      .from('izaque_agents')
      .update(biblicalAgentData)
      .eq('id', existingAgent.id)
      .select()
      .single();

    if (updErr) throw updErr;
    agentId = updated.id;
  } else {
    console.log(`✨ Inserindo novo agente "${biblicalAgentData.name}"...`);
    const { data: inserted, error: insErr } = await supabaseAdmin
      .from('izaque_agents')
      .insert(biblicalAgentData)
      .select()
      .single();

    if (insErr) throw insErr;
    agentId = inserted.id;
  }

  console.log(`✅ Agente Bíblico pronto no Supabase! ID: ${agentId}`);

  // 2. Materiais de Estudo Bíblico em João Ferreira de Almeida (JFA)
  const studyDocuments = [
    {
      title: 'Compêndio Bíblico JFA - Ansiedade, Medo e Inquietação da Alma',
      content: `
COMPÊNDIO BÍBLICO DE ACONSELHAMENTO PASTORAL (TRADUÇÃO JOÃO FERREIRA DE ALMEIDA - JFA)
TEMA: ANSIEDADE, MEDO, AFLIÇÃO E A PAZ QUE EXCEDE TODO O ENTENDIMENTO

1. Filipenses 4:6-7 (JFA):
"Não estejais inquietos por coisa alguma; antes as vossas petições sejam em tudo conhecidas diante de Deus pela oração e súplica, com ação de graças. E a paz de Deus, que excede todo o entendimento, guardará os vossos corações e os vossos pensamentos em Cristo Jesus."
Aplicação Pastoral: A ansiedade tenta nos convencer de que precisamos controlar o amanhã. Deus nos convida a transformar cada preocupação em oração e súplica. A paz de Deus não depende da ausência de problemas, mas da presença manifesta do Criador guardando os nossos pensamentos.

2. Isaías 41:10 (JFA):
"Não temas, porque eu sou contigo; não te assombres, porque eu sou teu Deus; eu te fortaleço, e te ajudo, e te sustento com a destra da minha justiça."
Aplicação Pastoral: O medo paralisante é desarmado pela certeza inabalável de que o Senhor não nos abandonou. Deus é quem nos segura pelas mãos e nos sustenta nas horas em que as forças humanas se esvaem.

3. 1 Pedro 5:7 (JFA):
"Lançando sobre ele toda a vossa ansiedade, porque ele tem cuidado de vós."
Aplicação Pastoral: O verbo "lançar" denota um ato consciente de entrega. Não fomos criados para carregar sozinhos o fardo das incertezas. Deus cuida ativamente e pessoalmente de cada detalhe da nossa jornada.

4. Salmos 46:1-3 (JFA):
"Deus é o nosso refúgio e fortaleza, socorro bem presente na angústia. Portanto não temeremos, ainda que a terra se mude, e ainda que os montes se transportem para o meio dos mares."
Aplicação Pastoral: Mesmo quando o chão sob os nossos pés parece tremer e tudo se desestrutura, o Senhor permanece como nossa rocha inabalável.

5. Mateus 6:25-34 (JFA):
"Olhai para as aves do céu, que nem semeiam, nem segam, nem ajuntam em celeiros; e vosso Pai celestial as alimenta. Não tendes vós muito mais valor do que elas? (...) Não vos inquieteis, pois, pelo dia de amanhã, porque o dia de amanhã cuidará de si mesmo. Basta a cada dia o seu mal."
Aplicação Pastoral: Jesus nos ensina a olhar para a providência diária do Pai. A ansiedade vive no futuro que ainda não existe; a fidelidade de Deus atua no presente momento.
      `,
    },
    {
      title: 'Compêndio Bíblico JFA - Cansaço, Sobrecarga e Renovação Espiritual',
      content: `
COMPÊNDIO BÍBLICO DE ACONSELHAMENTO PASTORAL (TRADUÇÃO JOÃO FERREIRA DE ALMEIDA - JFA)
TEMA: CANSAÇO DA ALMA, SOBRECARGA, DESÂNIMO E O DESCANSO EM DEUS

1. Mateus 11:28-30 (JFA):
"Vinde a mim, todos os que estais cansados e oprimidos, e eu vos aliviarei. Tomai sobre vós o meu jugo, e aprendei de mim, que sou manso e humilde de coração; e encontrareis descanso para as vossas almas. Porque o meu jugo é suave e o meu fardo é leve."
Aplicação Pastoral: O cansaço mais profundo não é o do corpo, mas o da alma. Quando tentamos ser fortes o tempo todo ou resolver tudo pelo nosso próprio esforço, entramos em estafa espiritual. Jesus nos convida a trocar o fardo pesado do perfeccionismo humano pela Sua graça mansa.

2. Salmos 23:1-3 (JFA):
"O SENHOR é o meu pastor, nada me faltará. Deitar-me faz em verdes pastos, guia-me mansamente a águas tranquilas. Refrigera a minha alma; guia-me pelas veredas da justiça, por amor do seu nome."
Aplicação Pastoral: O Bom Pastor não apenas nos guia; Ele nos faz descansar quando estamos exaustos demais para perceber que precisamos parar. A presença de Deus restaura e refrigera o ânimo interior.

3. Isaías 40:29-31 (JFA):
"Dá força ao cansado, e multiplica as forças ao que não tem nenhum vigor. Os jovens se cansarão e se fatigarão, e os moços certamente cairão; Mas os que esperam no SENHOR renovarão as forças, subirão com asas como águias; correrão, e não se cansarão; caminharão, e não se fatigarão."
Aplicação Pastoral: Até os mais fortes e jovens sofrem esgotamento quando confiam no próprio braço. Esperar no Senhor não é passividade vazia, mas uma confiança ativa de que as Suas forças divinas nos levantarão das cinzas do desânimo.

4. Salmos 121:1-2 (JFA):
"Levantarei os meus olhos para os montes, de onde vem o meu socorro. O meu socorro vem do SENHOR que fez o céu e a terra."
Aplicação Pastoral: Quando as circunstâncias ao nosso redor forem áridas e sufocantes, precisamos elevar nosso olhar da dor para o Criador de todas as coisas.
      `,
    },
    {
      title: 'Compêndio Bíblico JFA - Soberania de Deus, Fé e Propósito Divino',
      content: `
COMPÊNDIO BÍBLICO DE ACONSELHAMENTO PASTORAL (TRADUÇÃO JOÃO FERREIRA DE ALMEIDA - JFA)
TEMA: FÉ INABALÁVEL, CONFIANÇA NA SOBERANIA DE DEUS E NOVO COMEÇO

1. Provérbios 3:5-6 (JFA):
"Confia no SENHOR de todo o teu coração, e não te estribes no teu próprio entendimento. Reconhece-o em todos os teus caminhos, e ele endireitará as tuas veredas."
Aplicação Pastoral: O entendimento humano é limitado e muitas vezes nublado pela dor e pelas decepções. Colocar Deus em primeiro lugar significa confiar na sabedoria d'Ele mesmo quando não compreendemos todos os porquês do caminho.

2. Jeremias 29:11-12 (JFA):
"Porque eu bem sei os pensamentos que tenho a vosso respeito, diz o SENHOR; pensamentos de paz, e não de mal, para vos dar o fim que esperais. Então me invocareis, e ireis, e orareis a mim, e eu vos ouvirei."
Aplicação Pastoral: O Senhor não tem planos de destruição para a sua vida, mas de esperança e futuro. A oração sincera abre as portas da comunhão para experimentar essa boa vontade de Deus.

3. Romanos 8:28 e 8:38-39 (JFA):
"E sabemos que todas as coisas cooperam para o bem daqueles que amam a Deus, daqueles que são chamados segundo o seu propósito. (...) Porque estou certo de que, nem a morte, nem a vida, nem os anjos, nem os principados, nem as potestades, nem o presente, nem o porvir, nem a altura, nem a profundidade, nem alguma outra criatura nos poderá separar do amor de Deus, que está em Cristo Jesus nosso Senhor."
Aplicação Pastoral: Deus é especialista em redimir dores, erros do passado e momentos de deserto para construir propósito e maturidade. Absolutamente nada na criação tem o poder de romper o amor que Deus tem por você.

4. Salmos 37:5 (JFA):
"Entrega o teu caminho ao SENHOR; confia nele, e ele o fará."
Aplicação Pastoral: A entrega verdadeira requer soltar o controle das mãos e permitir que Deus execute aquilo que a ansiedade humana nunca seria capaz de alcançar.

5. Lamentações 3:22-23 (JFA):
"As misericórdias do SENHOR são a causa de não sermos consumidos, porque as suas misericórdias não têm fim; Novas são cada manhã; grande é a tua fidelidade."
Aplicação Pastoral: Cada novo dia é uma nova oportunidade de recomeçar debaixo da graça perdoadora e restauradora de Deus.
      `,
    },
  ];

  // 3. Ingestão dos 3 documentos para o agente bíblico
  for (const doc of studyDocuments) {
    console.log(`\n📚 Ingerindo: "${doc.title}"...`);
    try {
      const ingested = await ingestAgentDocument({
        agentId,
        title: doc.title,
        content: doc.content,
        fileType: 'biblical_corpus',
      });
      console.log(`✅ Ingestão concluída com sucesso! Total de trechos vetorizados: ${ingested.total_chunks}`);
    } catch (err) {
      console.error(`❌ Erro ao ingerir documento "${doc.title}":`, err.message);
    }
  }

  console.log('\n======================================================');
  console.log('🎉 AGENTE BÍBLICO PASTOR JOÃO CRIADO E CAPACITADO COM SUCESSO!');
  console.log('======================================================\n');
}

seedBiblicalSpecialist()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Falha fatal ao semear agente bíblico:', err);
    process.exit(1);
  });
