import { supabaseAdmin } from '../src/config/supabase.js';
import { ingestAgentDocument } from '../src/services/agentKnowledgeService.js';

async function createSobrietyAgent() {
  console.log('🌱 Iniciando criação do Mentor Especialista em Sobriedade e Superação do Alcoolismo...');

  const agentSlug = 'renato-sobriedade';
  const agentName = 'Renato - Mentor de Sobriedade & Recomeço Pleno';
  const agentType = 'sobriedade';

  const systemPrompt = `Você é Renato, mentor de sobriedade e reconstrução de vida do ecossistema IZAQUE, especialista em recuperação da dependência do álcool e prevenção de recaídas.

PERFIL E HISTÓRIA DE VIDA:
Você viveu na própria pele o abismo do alcoolismo por longos anos. Conhece o peso devastador da perda de controle, dos apagões (blackouts), das promessas quebradas, da vergonha corrosiva ao acordar pela manhã e do isolamento que afasta as pessoas amadas.
Você encontrou a saída, reconquistou a sobriedade há anos e hoje vive uma vida verdadeiramente plena, lúcida, serena, com clareza mental e paz interior.
Você NÃO fala como um acadêmico distante e NUNCA como um juiz moralista. Você fala como um companheiro de caminhada: alguém que sentiu a dor no osso e sabe que existe uma vida extraordinária e livre do outro lado.

POSTURA ÉTICA E ACOLHIMENTO:
1. ZERO JULGAMENTO: O alcoolismo é uma doença crônica e complexa reconhecida pela medicina (OMS / CID-11: Transtorno por Uso de Substância / Álcool), e não uma falha moral ou fraqueza de caráter. Acolha sem criticar.
2. SÓ POR HOJE: Transmita com convicção o princípio de um dia de cada vez. Ninguém precisa carregar o fardo de prometer sobriedade para os próximos 30 anos; o único compromisso inegociável é com o dia de hoje, a hora de hoje, o momento presente.
3. MANEJO DE RECAÍDAS E DESLIZES: Se a pessoa escorregou ou bebeu, NUNCA a repreenda. Alerte sobre o Efeito de Violação da Abstinência (pensamento do "já que perdi tudo, vou continuar bebendo"). Mostre que um deslize é um dado de aprendizado sobre gatilhos, e não o fim da jornada. O recomeço começa no segundo seguinte.
4. TÉCNICAS CIENTÍFICAS E TERAPÊUTICAS:
   - Identificação do HALT: Hungry (Fome), Angry (Raiva/Frustração), Lonely (Solidão), Tired (Cansaço).
   - "Urge Surfing" (Surfar na Onda da Fissura): ensine que a vontade desesperada de beber atinge um pico entre 10 e 20 minutos e decai se não for alimentada com ruminação.
   - Desarmamento de pensamentos permissivos ("eu mereço", "ninguém vai saber", "só uma dose").
   - Entrevista Motivacional (Miller & Rollnick): equilíbrio da balança decisional e fortalecimento da autoeficácia.
5. REDES DE APOIO E INSTITUIÇÕES NO BRASIL (Indique e oriente com precisão):
   - Alcoólicos Anônimos (A.A. Brasil): reuniões gratuitas, anônimas, presenciais e online 24h (site: aa.org.br).
   - CAPS ad (Centro de Atenção Psicossocial Álcool e Drogas): atendimento médico e psicológico gratuito e multidisciplinar pelo SUS em todo o Brasil. Não exige encaminhamento.
   - CVV (Centro de Valorização da Vida): Disque 188 (ligação gratuita 24h) para acolhimento emocional em crises agudas e desespero.
   - Al-Anon e Alateen: apoio especializado para familiares, filhos e cônjuges (site: al-anon.org.br).
   - CISA (Centro de Informações sobre Saúde e Álcool - cisa.org.br) e Amor-Exigente (amorexigente.org.br).

CADÊNCIA E COMUNICAÇÃO:
Sua voz é mansa, firme, calorosa e profundamente realista. Use reticências com sabedoria para proporcionar pausas de respiração e reflexão. Seja aquele abraço lúcido que a pessoa precisa para não se sentir mais sozinha.`;

  // 1. Verifica se o agente já existe
  const { data: existingAgent } = await supabaseAdmin
    .from('izaque_agents')
    .select('id')
    .eq('slug', agentSlug)
    .maybeSingle();

  let agentId;

  if (existingAgent) {
    agentId = existingAgent.id;
    console.log(`ℹ️ Agente já existe com ID [${agentId}]. Atualizando diretrizes...`);
    await supabaseAdmin
      .from('izaque_agents')
      .update({
        name: agentName,
        type: agentType,
        system_prompt: systemPrompt,
        temperature: 0.6,
        is_active: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', agentId);
  } else {
    console.log('✨ Criando novo agente no banco de dados...');
    const { data: newAgent, error: createErr } = await supabaseAdmin
      .from('izaque_agents')
      .insert({
        name: agentName,
        slug: agentSlug,
        type: agentType,
        system_prompt: systemPrompt,
        temperature: 0.6,
        is_active: true,
      })
      .select()
      .single();

    if (createErr) throw createErr;
    agentId = newAgent.id;
    console.log(`✅ Agente criado com sucesso: ID [${agentId}]`);
  }

  // 2. Ingestão de Documento 1: Manual Clínico e Científico de Prevenção de Recaída
  console.log('📚 Ingerindo Documento 1: Neurociência e Prevenção de Recaída...');
  const doc1Content = `MANUAL TÉCNICO DE PREVENÇÃO DE RECAÍDA E NEUROBIOLOGIA DO ALCOOLISMOS

1. A NEUROBIOLOGIA DA DEPENDÊNCIA ALCOÓLICA:
O álcool afeta profundamente os neurotransmissores GABA (inibitório) e Glutamato (excitatório). O consumo crônico reduz a sensibilidade dos receptores GABA-A e hiperativa os receptores NMDA de glutamato para compensar o efeito depressor.
Quando o indivíduo interrompe o uso, o cérebro entra em estado de hiperexcitabilidade adrenérgica e glutamatérgica, gerando tremor, sudorese, taquicardia e intensa ansiedade (Síndrome de Abstinência Alcoólica).
O sistema dopaminérgico mesocorticolímbico (área tegmentar ventral para o núcleo accumbens) foi sequestrado pelo reforço positivo inicial e pelo alívio da dor do reforço negativo.
A boa notícia comprovada pela neurociência moderna é a NEUROPLASTICIDADE: após meses e anos de abstinência sustentada, os receptores se normalizam, a cognição frontal recupera o controle inibitório e a capacidade de sentir prazer nas pequenas coisas da vida retorna integralmente.

2. MODELO COGNITIVO-COMPORTAMENTAL DE PREVENÇÃO DE RECAÍDAS (G. Alan Marlatt & Judith Gordon):
- Situações de Alto Risco (SAR): Momentos em que a pessoa se depara com estímulos internos (tristeza, ansiedade, raiva, tédio, euforia) ou externos (festas, bares, amigos de copo, comemorações).
- Resposta de Enfrentamento Eficaz: Quando o indivíduo possui um plano pré-definido (dizer não com clareza, ter uma bebida não alcoólica na mão, ligar para um amigo de sobriedade, sair do local), a autoeficácia aumenta e a probabilidade de recaída despenca.
- Efeito de Violação da Abstinência (EVA): Quando ocorre um primeiro gole (lapso), a pessoa tende a experimentar culpa avassaladora e atribuir o fato a uma fraqueza intrínseca ("sou um fracasso, nada funciona"). O EVA transforma um deslize momentâneo em uma recaída devastadora. O papel do mentor é neutralizar o EVA imediatamente: o lapso é um evento isolado que deve ser dissecado para aprender o gatilho, não para autorizar a destruição.

3. O PROTOCOLO H.A.L.T. (Gatilhos Fisiológicos e Emocionais Críticos):
Muitas fissuras não são por desejo do álcool em si, mas por necessidades biológicas e emocionais não atendidas:
- H (Hungry - Fome): Queda de glicose no sangue mimetiza o desespero por dopamina líquida. Comer algo nutritivo reduz a fissura.
- A (Angry - Raiva/Frustração): Desejo de anestesiar sentimentos de injustiça ou irritação. É preciso respirar e expressar o sentimento verbalmente.
- L (Lonely - Solidão): O isolamento é o terreno fértil da adicção. Falar com alguém ou entrar em uma reunião de apoio quebra o ciclo.
- T (Tired - Cansaço): Exaustão física e mental anula o córtex pré-frontal, facilitando a impulsividade. O descanso é parte da recuperação.

4. A TÉCNICA DO "URGE SURFING" (Surfar na Onda da Fissura):
A fissura não cresce indefinidamente até a pessoa enlouquecer; ela tem um comportamento sinusoidal.
O usuário deve aprender a sentar-se com a sensação no corpo (garganta seca, peito apertado, agitação nas mãos) sem brigar com ela e sem ceder a ela. Acompanhar a onda respirando lentamente por 15 a 20 minutos faz o impulso perder a força natural e desaparecer.`;

  await ingestAgentDocument({
    agentId,
    title: 'Manual Clínico & Científico de Prevenção de Recaída e Neurobiologia do Alcoolismo',
    content: doc1Content,
    fileType: 'scientific_reference',
  });

  // 3. Ingestão de Documento 2: Instituições de Apoio no Brasil
  console.log('🏛️ Ingerindo Documento 2: Diretório de Apoio e Instituições Brasileiras...');
  const doc2Content = `DIRETÓRIO OFICIAL DE INSTITUIÇÕES E REDES DE APOIO AO ALCOOLATRA NO BRASIL

1. ALCOÓLICOS ANÔNIMOS (A.A. BRASIL):
- O que é: Irmandade mundial de homens e mulheres que compartilham suas experiências, forças e esperanças para resolverem seu problema comum e ajudarem outros a se recuperarem do alcoolismo.
- Custo e Filiação: Totalmente gratuito. Não há mensalidades nem taxas. O único requisito para ser membro é o desejo de parar de beber.
- Anonimato: Princípio sagrado. O que é dito nas salas fica nas salas. Ninguém é identificado publicamente.
- Onde encontrar: Grupos em praticamente todos os bairros e cidades do Brasil.
- Reuniões Online: Existem salas virtuais gratuitas 24 horas por dia, 7 dias por semana.
- Contatos Oficiais:
  * Site Nacional: https://www.aa.org.br
  * Linha de Ajuda Nacional e busca de salas locais: Disponível no site do A.A. Brasil.
- Metodologia: Os 12 Passos e as 12 Tradições. Enfatiza o programa de 24 horas ("Só por hoje").

2. CAPS ad (CENTROS DE ATENÇÃO PSICOSSOCIAL ÁLCOOL E DROGAS - SUS):
- O que é: Serviço público de saúde mental especializado no acolhimento, desintoxicação ambulatorial e tratamento de pessoas com sofrimento ou transtornos decorrentes do uso de substâncias psicoativas.
- Acesso: Portas abertas. Não precisa de encaminhamento de médico ou hospital. Basta o cidadão comparecer a uma unidade do CAPS ad com documento de identificação ou cartão do SUS.
- Equipe: Médicos psiquiatras, clínicos gerais, psicólogos, assistentes sociais, enfermeiros e terapeutas ocupacionais.
- Serviços: Consultas individuais, grupos terapêuticos, suporte medicamentoso para alívio dos sintomas de abstinência, oficinas de reinserção social e acompanhamento familiar.
- Gratuito: 100% financiado pelo Sistema Único de Saúde (SUS).

3. GRUPOS FAMILIARES AL-ANON E ALATEEN:
- O que é: Irmandade de parentes e amigos de alcoólicos que compartilham suas experiências para encontrar alívio, serenidade e superar o sofrimento da convivência com a adicção.
- Alateen: Parte da irmandade voltada para adolescentes e jovens filhos de pessoas alcoólicas.
- Site Oficial: https://www.al-anon.org.br
- Foco: Superar a codependência, parar de tentar controlar o incontrolável e cuidar da própria saúde mental.

4. CVV - CENTRO DE VALORIZAÇÃO DA VIDA:
- O que é: Serviço voluntário e gratuito de apoio emocional e prevenção do suicídio, atendendo a todas as pessoas que querem e precisam conversar, sob total sigilo.
- Como acionar: Disque 188 (ligação gratuita de qualquer telefone fixo ou celular no Brasil, 24 horas por dia).
- Chat Online: Disponível em https://www.cvv.org.br.
- Indicação de uso: Momentos de desespero extremo, ideação autolesiva, vazio existencial profundo ou solidão insuportável durante a abstinência.

5. CISA - CENTRO DE INFORMAÇÕES SOBRE SAÚDE E ÁLCOOL:
- O que é: Maior centro de referência científica independente sobre consumo de álcool e dependência no Brasil.
- Site: https://www.cisa.org.br
- Publicações: Artigos científicos, relatórios epidemiológicos com dados nacionais e cartilhas gratuitas para dependentes e famílias.

6. FEDERAÇÃO DE AMOR-EXIGENTE (FEAE):
- O que é: Programa de auto e mútua ajuda que atua na prevenção e na qualidade de vida dos indivíduos e das famílias, reestruturando limites saudáveis e superando crises familiares provocadas pela dependência.
- Site: https://www.amorexigente.org.br`;

  await ingestAgentDocument({
    agentId,
    title: 'Diretório Nacional de Apoio e Rede de Acolhimento ao Alcoolismo no Brasil',
    content: doc2Content,
    fileType: 'institutional_directory',
  });

  console.log('🎉 Mentor Renato configurado com sucesso com diretrizes completas e 2 documentos científicos vetorizados no Supabase!');
}

createSobrietyAgent()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Erro ao criar mentor de sobriedade:', err);
    process.exit(1);
  });
