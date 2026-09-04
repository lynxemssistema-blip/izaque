import React, { useState } from 'react';
import {
  HelpCircle,
  Users,
  Heart,
  Compass,
  BookOpen,
  Sliders,
  Volume2,
  Terminal,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  Feather,
  Info,
  Layers,
  FileText,
  Lock,
} from 'lucide-react';

export default function AdminHelpGuide() {
  const [copiedCmd, setCopiedCmd] = useState('');
  const [openSections, setOpenSections] = useState({
    users: true,
    memories: true,
    agents: true,
    knowledge: true,
    voice: false,
    vps: false,
  });

  const toggleSection = (key) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedCmd(id);
    setTimeout(() => setCopiedCmd(''), 2000);
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-10">
      {/* CABEÇALHO DO GUIA */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-stone-900 via-slate-900 to-stone-900 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-teal-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 border border-teal-500/30 text-teal-300 text-xs font-serif">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Painel de Governança & Documentação Interna</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-serif font-medium text-stone-100">
              Manual de Instruções do Administrador
            </h2>
            <p className="text-xs sm:text-sm text-stone-300 font-serif max-w-2xl leading-relaxed">
              Guia oficial de operação do Santuário IZAQUE. Aqui você encontra todos os detalhes sobre gestão de usuários, memórias psicológicas, mentores especialistas, base de estudos e infraestrutura.
            </p>
          </div>
          <div className="w-16 h-16 rounded-3xl bg-white/10 border border-white/20 flex items-center justify-center shrink-0">
            <Feather className="w-8 h-8 text-teal-300 stroke-[1.5]" />
          </div>
        </div>
      </div>

      {/* ÍNDICE RÁPIDO EM CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { id: 'users', label: '1. Usuários & Níveis', icon: Users, color: 'text-teal-700 dark:text-teal-400' },
          { id: 'memories', label: '2. Memória Psicológica', icon: Heart, color: 'text-rose-700 dark:text-rose-400' },
          { id: 'agents', label: '3. Multi-Agentes', icon: Compass, color: 'text-amber-700 dark:text-amber-400' },
          { id: 'knowledge', label: '4. Base de Estudos', icon: BookOpen, color: 'text-indigo-700 dark:text-indigo-400' },
          { id: 'voice', label: '5. Voz Humanizada', icon: Volume2, color: 'text-teal-700 dark:text-teal-400' },
          { id: 'vps', label: '6. VPS & Manutenção', icon: Terminal, color: 'text-emerald-700 dark:text-emerald-400' },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => {
                setOpenSections((prev) => ({ ...prev, [item.id]: true }));
                document.getElementById(`section-${item.id}`)?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="p-3.5 rounded-2xl bg-white dark:bg-slate-800 border border-stone-200/80 dark:border-slate-700 text-left hover:border-teal-600 transition shadow-sm flex flex-col gap-2"
            >
              <Icon className={`w-4 h-4 ${item.color}`} />
              <span className="text-xs font-serif font-medium text-stone-800 dark:text-stone-200">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* SEÇÃO 1: GESTÃO DE USUÁRIOS E PAPÉIS */}
      <div id="section-users" className="rounded-3xl bg-white dark:bg-slate-800/80 border border-stone-200/80 dark:border-slate-700 overflow-hidden shadow-sm">
        <button
          onClick={() => toggleSection('users')}
          className="w-full p-5 sm:p-6 flex items-center justify-between text-left hover:bg-stone-50 dark:hover:bg-slate-750 transition"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-teal-700/10 dark:bg-teal-500/15 border border-teal-700/20 text-teal-800 dark:text-teal-400 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-serif font-medium text-stone-900 dark:text-stone-50">
                1. Gestão de Usuários e Níveis de Acesso
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Entenda os 3 níveis de permissão no Santuário e como promover administradores
              </p>
            </div>
          </div>
          {openSections.users ? <ChevronUp className="w-5 h-5 text-stone-400" /> : <ChevronDown className="w-5 h-5 text-stone-400" />}
        </button>

        {openSections.users && (
          <div className="p-5 sm:p-6 pt-0 space-y-4 border-t border-stone-100 dark:border-slate-700/60 text-xs sm:text-sm text-stone-700 dark:text-stone-300 font-serif leading-relaxed">
            <p>
              O Santuário IZAQUE possui três papéis de usuário rigorosamente definidos pela segurança de linhas do banco de dados (Row Level Security - RLS do Supabase):
            </p>

            <div className="grid sm:grid-cols-3 gap-3 my-3">
              <div className="p-4 rounded-2xl bg-stone-50 dark:bg-slate-850 border border-stone-200 dark:border-slate-700">
                <span className="font-semibold text-teal-800 dark:text-teal-400 text-xs uppercase tracking-wider block">
                  Papel: user
                </span>
                <p className="text-xs mt-1 text-stone-600 dark:text-stone-300">
                  <strong>Usuário Comum:</strong> Acessa o Santuário (`/`), conversa com Izaque por texto ou voz, ouve reflexões e visualiza apenas o seu próprio histórico persistido. <em>Não tem acesso ao painel admin.</em>
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-stone-50 dark:bg-slate-850 border border-stone-200 dark:border-slate-700">
                <span className="font-semibold text-teal-800 dark:text-teal-400 text-xs uppercase tracking-wider block">
                  Papel: admin
                </span>
                <p className="text-xs mt-1 text-stone-600 dark:text-stone-300">
                  <strong>Gerente do Santuário:</strong> Acessa o `/admin`. Pode ver a lista de usuários, acompanhar memórias de sessões, criar novos mentores e anexar materiais de estudo técnicos.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-stone-50 dark:bg-slate-850 border border-stone-200 dark:border-slate-700">
                <span className="font-semibold text-amber-700 dark:text-amber-400 text-xs uppercase tracking-wider block">
                  Papel: master
                </span>
                <p className="text-xs mt-1 text-stone-600 dark:text-stone-300">
                  <strong>Super Administrador:</strong> Poder total. Pode alterar os papéis de outros administradores e excluir mentores especialistas cadastrados. O agente mestre `izaque-master` é protegido e nunca pode ser apagado.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-teal-50/60 dark:bg-teal-950/30 border border-teal-200/60 dark:border-teal-800/40 text-xs text-teal-900 dark:text-teal-200">
              <strong>💡 Como alterar o papel de alguém:</strong> Na aba <em>"Usuários"</em>, basta selecionar o novo papel na caixa de seleção ao lado do nome do usuário. A atualização no banco de dados ocorre instantaneamente sem precisar reiniciar nada.
            </div>
          </div>
        )}
      </div>

      {/* SEÇÃO 2: MEMÓRIA PSICOLÓGICA DE LONGO PRAZO */}
      <div id="section-memories" className="rounded-3xl bg-white dark:bg-slate-800/80 border border-stone-200/80 dark:border-slate-700 overflow-hidden shadow-sm">
        <button
          onClick={() => toggleSection('memories')}
          className="w-full p-5 sm:p-6 flex items-center justify-between text-left hover:bg-stone-50 dark:hover:bg-slate-750 transition"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-rose-700/10 dark:bg-rose-500/15 border border-rose-700/20 text-rose-800 dark:text-rose-400 flex items-center justify-center">
              <Heart className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-serif font-medium text-stone-900 dark:text-stone-50">
                2. Sistema de Memória Psicológica & RAG (pgvector 768d)
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Como o app extrai travas emocionais em background e relembra naturalmente
              </p>
            </div>
          </div>
          {openSections.memories ? <ChevronUp className="w-5 h-5 text-stone-400" /> : <ChevronDown className="w-5 h-5 text-stone-400" />}
        </button>

        {openSections.memories && (
          <div className="p-5 sm:p-6 pt-0 space-y-4 border-t border-stone-100 dark:border-slate-700/60 text-xs sm:text-sm text-stone-700 dark:text-stone-300 font-serif leading-relaxed">
            <p>
              O Santuário IZAQUE não é um chatbot comum que esquece a conversa ao fechar a janela. Ele possui uma <strong>Arquitetura Cognitiva em Background</strong>:
            </p>

            <ol className="list-decimal pl-5 space-y-2">
              <li>
                <strong>Extração Invisível:</strong> Toda vez que o usuário envia uma reflexão (texto ou áudio), o servidor responde imediatamente para manter o usuário acolhido. Em seguida, um sub-processo analisa a conversa e extrai fatos psicológicos profundos.
              </li>
              <li>
                <strong>Vetorização em 768 Dimensões:</strong> O fato extraído é transformado em um vetor semântico através do modelo <code>text-embedding-004</code> do Google Gemini e salvo na tabela <code>izaque_user_memories</code> com o <code>pgvector</code> no PostgreSQL.
              </li>
              <li>
                <strong>Resgate por Similaridade de Cosseno:</strong> Nas conversas seguintes, quando o usuário expressa uma dúvida parecida, a função do banco <code>izaque_match_memories</code> resgata apenas as lembranças mais pertinentes e entrega para o mentor conduzir o diálogo com sabedoria.
              </li>
            </ol>

            <h4 className="font-semibold text-stone-900 dark:text-stone-100 pt-2">
              As 4 Categorias de Memória Extraídas:
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40">
                <span className="font-semibold text-red-800 dark:text-red-300 block">bloqueio (blocker)</span>
                <span className="text-[11px] text-stone-600 dark:text-stone-400">Medo paralisante ou trava de ação</span>
              </div>
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40">
                <span className="font-semibold text-amber-800 dark:text-amber-300 block">crença (belief)</span>
                <span className="text-[11px] text-stone-600 dark:text-stone-400">Ideia limitante sobre dinheiro ou si mesmo</span>
              </div>
              <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900/40">
                <span className="font-semibold text-indigo-800 dark:text-indigo-300 block">padrão (pattern)</span>
                <span className="text-[11px] text-stone-600 dark:text-stone-400">Autossabotagem ou ciclo repetitivo</span>
              </div>
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/40">
                <span className="font-semibold text-emerald-800 dark:text-emerald-300 block">meta (goal)</span>
                <span className="text-[11px] text-stone-600 dark:text-stone-400">Objetivo legítimo e direção de futuro</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* SEÇÃO 3: MULTI-AGENTES E ORQUESTRADOR DINÂMICO */}
      <div id="section-agents" className="rounded-3xl bg-white dark:bg-slate-800/80 border border-stone-200/80 dark:border-slate-700 overflow-hidden shadow-sm">
        <button
          onClick={() => toggleSection('agents')}
          className="w-full p-5 sm:p-6 flex items-center justify-between text-left hover:bg-stone-50 dark:hover:bg-slate-750 transition"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-amber-700/10 dark:bg-amber-500/15 border border-amber-700/20 text-amber-800 dark:text-amber-400 flex items-center justify-center">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-serif font-medium text-stone-900 dark:text-stone-50">
                3. Orquestrador Central Multi-Agente & Roteamento Inteligente
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Como o app escolhe o especialista certo sem quebrar a serenidade do usuário
              </p>
            </div>
          </div>
          {openSections.agents ? <ChevronUp className="w-5 h-5 text-stone-400" /> : <ChevronDown className="w-5 h-5 text-stone-400" />}
        </button>

        {openSections.agents && (
          <div className="p-5 sm:p-6 pt-0 space-y-4 border-t border-stone-100 dark:border-slate-700/60 text-xs sm:text-sm text-stone-700 dark:text-stone-300 font-serif leading-relaxed">
            <p>
              O usuário não precisa saber de nomes técnicos ou escolher agentes manualmente. O <strong>Orquestrador Central</strong> atua como um maestro invisível:
            </p>

            <div className="space-y-2">
              <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-slate-850 border border-stone-200 dark:border-slate-700 flex items-start gap-3">
                <span className="text-base">📖</span>
                <div>
                  <strong className="text-stone-900 dark:text-stone-100">Pastor João — Conselheiro Bíblico (JFA):</strong>
                  <p className="text-xs text-stone-600 dark:text-stone-400 mt-0.5">
                    Acionado quando o usuário fala sobre fé, Deus, oração, versículos bíblicos ou cansaço da alma. Fundamenta suas orientações na Bíblia Sagrada (João Ferreira de Almeida) e coloca Deus em primeiro lugar.
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-slate-850 border border-stone-200 dark:border-slate-700 flex items-start gap-3">
                <span className="text-base">💰</span>
                <div>
                  <strong className="text-stone-900 dark:text-stone-100">Dr. Marcus — Mentalidade Financeira:</strong>
                  <p className="text-xs text-stone-600 dark:text-stone-400 mt-0.5">
                    Acionado para desatar bloqueios de escassez, culpa inconsciente ao cobrar caro, medo de perder dinheiro ou autossabotagem quando o caixa da empresa cresce.
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-slate-850 border border-stone-200 dark:border-slate-700 flex items-start gap-3">
                <span className="text-base">👥</span>
                <div>
                  <strong className="text-stone-900 dark:text-stone-100">Helena Vance — Liderança & Delegação:</strong>
                  <p className="text-xs text-stone-600 dark:text-stone-400 mt-0.5">
                    Acionada quando o líder sofre por centralizar tarefas, não confiar na equipe ou ter medo de delegar e perder o controle.
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-slate-850 border border-stone-200 dark:border-slate-700 flex items-start gap-3">
                <span className="text-base">🌿</span>
                <div>
                  <strong className="text-stone-900 dark:text-stone-100">IZAQUE Master — Arquiteto da Mentalidade:</strong>
                  <p className="text-xs text-stone-600 dark:text-stone-400 mt-0.5">
                    Responsável pelo acolhimento geral, superação de procrastinação, clareza de propósito e desatar nós emocionais difusos.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 text-xs text-amber-900 dark:text-amber-200">
              <strong>Como ajustar a Temperatura do Agente:</strong>
              <ul className="list-disc pl-4 mt-1 space-y-1">
                <li><code>0.40 - 0.50</code>: Rigor e precisão. Ideal para citações bíblicas literais e regras objetivas.</li>
                <li><code>0.60 - 0.70</code>: Equilíbrio clássico. Tom empático, conversacional e autoridade sábia.</li>
                <li><code>0.80+</code>: Criatividade e metáforas mais abertas.</li>
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* SEÇÃO 4: BASE DE ESTUDOS (RAG DE DOMÍNIO) */}
      <div id="section-knowledge" className="rounded-3xl bg-white dark:bg-slate-800/80 border border-stone-200/80 dark:border-slate-700 overflow-hidden shadow-sm">
        <button
          onClick={() => toggleSection('knowledge')}
          className="w-full p-5 sm:p-6 flex items-center justify-between text-left hover:bg-stone-50 dark:hover:bg-slate-750 transition"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-indigo-700/10 dark:bg-indigo-500/15 border border-indigo-700/20 text-indigo-800 dark:text-indigo-400 flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-serif font-medium text-stone-900 dark:text-stone-50">
                4. Base de Conhecimento & Estudos (Documentos do Agente)
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Como ensinar metodologias e materiais técnicos aos mentores especialistas
              </p>
            </div>
          </div>
          {openSections.knowledge ? <ChevronUp className="w-5 h-5 text-stone-400" /> : <ChevronDown className="w-5 h-5 text-stone-400" />}
        </button>

        {openSections.knowledge && (
          <div className="p-5 sm:p-6 pt-0 space-y-4 border-t border-stone-100 dark:border-slate-700/60 text-xs sm:text-sm text-stone-700 dark:text-stone-300 font-serif leading-relaxed">
            <p>
              Você pode transformar qualquer agente em uma autoridade inquestionável em um assunto subindo materiais de estudo para ele.
            </p>

            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-teal-700 dark:text-teal-400 shrink-0 mt-0.5" />
                <span><strong>Formatos Aceitos:</strong> Arquivos em <code>.pdf</code>, <code>.txt</code>, <code>.md</code> ou colando texto diretamente no editor.</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-teal-700 dark:text-teal-400 shrink-0 mt-0.5" />
                <span><strong>Processamento Automático:</strong> O backend divide o material em trechos de ~1000 caracteres com sobreposição de 150 caracteres para preservar o contexto.</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-teal-700 dark:text-teal-400 shrink-0 mt-0.5" />
                <span><strong>Busca em Tempo Real:</strong> Quando o usuário menciona um assunto relacionado ao estudo, a função <code>izaque_match_agent_knowledge</code> injeta os trechos exatos no prompt do mentor.</span>
              </div>
            </div>

            <p className="text-xs text-stone-500 dark:text-stone-400">
              <em>Exemplo Real:</em> No Pastor João, foram indexados 3 compêndios bíblicos em JFA totalizando 10 vetores ativos, permitindo que ele cite literalmente versículos como Filipenses 4:6-7 e Isaías 41:10 sem inventar passagens.
            </p>
          </div>
        )}
      </div>

      {/* SEÇÃO 5: VOZ HUMANIZADA & CACHE DE ÁUDIO */}
      <div id="section-voice" className="rounded-3xl bg-white dark:bg-slate-800/80 border border-stone-200/80 dark:border-slate-700 overflow-hidden shadow-sm">
        <button
          onClick={() => toggleSection('voice')}
          className="w-full p-5 sm:p-6 flex items-center justify-between text-left hover:bg-stone-50 dark:hover:bg-slate-750 transition"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-teal-700/10 dark:bg-teal-500/15 border border-teal-700/20 text-teal-800 dark:text-teal-400 flex items-center justify-center">
              <Volume2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-serif font-medium text-stone-900 dark:text-stone-50">
                5. Voz Humanizada, Áudio Ducking & Cache no Supabase
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                O segredo da escuta terapêutica e como o cache reduz custos de API a zero
              </p>
            </div>
          </div>
          {openSections.voice ? <ChevronUp className="w-5 h-5 text-stone-400" /> : <ChevronDown className="w-5 h-5 text-stone-400" />}
        </button>

        {openSections.voice && (
          <div className="p-5 sm:p-6 pt-0 space-y-4 border-t border-stone-100 dark:border-slate-700/60 text-xs sm:text-sm text-stone-700 dark:text-stone-300 font-serif leading-relaxed">
            <div className="space-y-3">
              <div className="p-4 rounded-2xl bg-stone-50 dark:bg-slate-850 border border-stone-200 dark:border-slate-700">
                <strong className="text-stone-900 dark:text-stone-100 block mb-1">
                  1. A Mágica das Reticências (...)
                </strong>
                <p className="text-xs text-stone-600 dark:text-stone-400">
                  Para que a voz não soe como um robô que lê texto corrido, os prompts dos mentores instruem o uso de reticências estratégicas. Os sintetizadores neurais interpretam as reticências como pausas respiratórias de ~1 segundo, criando uma sensação profunda de calma e escuta.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-stone-50 dark:bg-slate-850 border border-stone-200 dark:border-slate-700">
                <strong className="text-stone-900 dark:text-stone-100 block mb-1">
                  2. Cache Permanente no Supabase Storage (`audio_cache`)
                </strong>
                <p className="text-xs text-stone-600 dark:text-stone-400">
                  Cada reflexão de áudio tem seu texto sanitizado e recebe uma assinatura criptográfica SHA-256. O arquivo MP3 gerado é armazenado no bucket público <code>audio_cache</code>. Sempre que o usuário ou outra pessoa ouve a mesma mensagem, o backend entrega direto do storage em menos de 80ms, com custo zero de API.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-stone-50 dark:bg-slate-850 border border-stone-200 dark:border-slate-700">
                <strong className="text-stone-900 dark:text-stone-100 block mb-1">
                  3. Áudio Ducking Dinâmico (Web Audio API)
                </strong>
                <p className="text-xs text-stone-600 dark:text-stone-400">
                  Quando a trilha sonora de 432 Hz ou som de chuva está ativa, o sistema abaixa o volume da música suavemente para 4% assim que o guia começa a falar, e restaura para o volume original ao terminar a fala.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* SEÇÃO 6: DEPLOY NA VPS E COMANDOS ÚTEIS */}
      <div id="section-vps" className="rounded-3xl bg-white dark:bg-slate-800/80 border border-stone-200/80 dark:border-slate-700 overflow-hidden shadow-sm">
        <button
          onClick={() => toggleSection('vps')}
          className="w-full p-5 sm:p-6 flex items-center justify-between text-left hover:bg-stone-50 dark:hover:bg-slate-750 transition"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-emerald-700/10 dark:bg-emerald-500/15 border border-emerald-700/20 text-emerald-800 dark:text-emerald-400 flex items-center justify-center">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-serif font-medium text-stone-900 dark:text-stone-50">
                6. Operação na VPS Hostinger & Comandos Rápidos
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Comandos de terminal para manter o servidor online 24/7 e atualizar o código
              </p>
            </div>
          </div>
          {openSections.vps ? <ChevronUp className="w-5 h-5 text-stone-400" /> : <ChevronDown className="w-5 h-5 text-stone-400" />}
        </button>

        {openSections.vps && (
          <div className="p-5 sm:p-6 pt-0 space-y-4 border-t border-stone-100 dark:border-slate-700/60 text-xs sm:text-sm text-stone-700 dark:text-stone-300 font-serif leading-relaxed">
            <p>
              Na sua VPS Ubuntu, o aplicativo roda sob o gerenciador <strong>PM2</strong>. Aqui estão os comandos mais usados:
            </p>

            <div className="space-y-3 font-mono text-xs">
              <div className="p-3.5 rounded-2xl bg-stone-900 text-stone-100 flex items-center justify-between">
                <div>
                  <span className="text-stone-500 block text-[10px]"># Ver status do servidor</span>
                  <code>pm2 status</code>
                </div>
                <button
                  onClick={() => copyToClipboard('pm2 status', 'cmd1')}
                  className="p-2 text-stone-400 hover:text-white"
                >
                  {copiedCmd === 'cmd1' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>

              <div className="p-3.5 rounded-2xl bg-stone-900 text-stone-100 flex items-center justify-between">
                <div>
                  <span className="text-stone-500 block text-[10px]"># Ver logs e transcrições em tempo real</span>
                  <code>pm2 logs izaque-app</code>
                </div>
                <button
                  onClick={() => copyToClipboard('pm2 logs izaque-app', 'cmd2')}
                  className="p-2 text-stone-400 hover:text-white"
                >
                  {copiedCmd === 'cmd2' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>

              <div className="p-3.5 rounded-2xl bg-stone-900 text-stone-100 flex items-center justify-between">
                <div>
                  <span className="text-stone-500 block text-[10px]"># Atualizar o app com o código mais recente do Git</span>
                  <code>git pull origin main && pm2 restart izaque-app</code>
                </div>
                <button
                  onClick={() => copyToClipboard('git pull origin main && pm2 restart izaque-app', 'cmd3')}
                  className="p-2 text-stone-400 hover:text-white"
                >
                  {copiedCmd === 'cmd3' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>

              <div className="p-3.5 rounded-2xl bg-stone-900 text-stone-100 flex items-center justify-between">
                <div>
                  <span className="text-stone-500 block text-[10px]"># Reiniciar o servidor se necessário</span>
                  <code>pm2 restart izaque-app</code>
                </div>
                <button
                  onClick={() => copyToClipboard('pm2 restart izaque-app', 'cmd4')}
                  className="p-2 text-stone-400 hover:text-white"
                >
                  {copiedCmd === 'cmd4' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-stone-100 dark:bg-slate-850 border border-stone-200 dark:border-slate-700 text-xs">
              <strong>Repositório Git de Publicação:</strong>
              <div className="flex items-center justify-between mt-1">
                <code className="text-teal-700 dark:text-teal-300 font-mono">
                  https://github.com/lynxemssistema-blip/izaque.git
                </code>
                <button
                  onClick={() => copyToClipboard('https://github.com/lynxemssistema-blip/izaque.git', 'repo')}
                  className="p-1 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200"
                >
                  {copiedCmd === 'repo' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
