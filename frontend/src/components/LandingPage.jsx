import React from 'react';
import {
  Feather,
  Wind,
  Heart,
  Compass,
  ShieldCheck,
  ArrowRight,
  Sun,
  Moon,
  CheckCircle2,
  ChevronRight,
  Sparkles,
  Smile,
  BookOpen,
  Coffee,
} from 'lucide-react';

export default function LandingPage({ onStartChat, user }) {
  return (
    <div className="min-h-screen bg-stone-50 dark:bg-slate-900 text-stone-800 dark:text-stone-100 overflow-x-hidden transition-colors duration-300 font-sans selection:bg-teal-700/20 selection:text-teal-900 dark:selection:text-teal-200">
      {/* GLOW DECORATIVO SUAVE & ORGÂNICO (Sem tons neon/cibernéticos) */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[640px] overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[-15%] left-1/4 w-[550px] h-[450px] bg-teal-600/10 dark:bg-teal-500/10 blur-[130px] rounded-full" />
        <div className="absolute top-[-5%] right-1/4 w-[480px] h-[380px] bg-amber-600/10 dark:bg-amber-500/10 blur-[120px] rounded-full" />
      </div>

      {/* 1. SEÇÃO PRINCIPAL (HERO) */}
      <section className="relative pt-20 sm:pt-28 pb-20 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto text-center">
        {/* Pílula de Acolhimento */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-stone-200/70 dark:bg-slate-800/80 border border-stone-300/60 dark:border-slate-700/80 text-xs text-stone-600 dark:text-stone-300 mb-8 backdrop-blur-md shadow-sm">
          <span className="flex h-2 w-2 rounded-full bg-teal-600 dark:bg-teal-400 animate-pulse" />
          <span className="font-serif font-medium text-teal-800 dark:text-teal-300">
            Santuário de Clareza & Escuta
          </span>
          <span>•</span>
          <span>Um refúgio para desacelerar e se reencontrar</span>
        </div>

        {/* Título Principal Humanizado */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-serif font-normal tracking-tight text-stone-900 dark:text-stone-50 max-w-4xl mx-auto leading-[1.18]">
          Desate os nós da sua mente.{' '}
          <span className="italic font-medium text-teal-800 dark:text-teal-300">
            Cure a hesitação.
          </span>{' '}
          Reencontre sua paz e direção.
        </h1>

        {/* Descrição Apresentando Izaque */}
        <p className="mt-6 text-base sm:text-xl text-stone-600 dark:text-stone-300 max-w-2xl mx-auto leading-relaxed font-serif">
          Conheça <strong>Izaque</strong>: um guia de presença calma e escuta profunda, dedicado a ajudar você a compreender bloqueios emocionais, quebrar ciclos de autossabotagem e reconstruir a confiança no seu caminho.
        </p>

        {/* Chamadas para Ação */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={onStartChat}
            className="w-full sm:w-auto px-9 py-4 rounded-2xl bg-teal-700 hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500 text-white font-medium text-sm tracking-wide shadow-xl shadow-teal-700/25 transition-all duration-300 transform hover:-translate-y-0.5 flex items-center justify-center gap-3"
          >
            <Feather className="w-4 h-4 stroke-[2]" />
            <span>{user ? 'Entrar no Meu Santuário com Izaque' : 'Conversar com Izaque'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <a
            href="#quem-e-izaque"
            className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-white/80 dark:bg-slate-800/80 hover:bg-white dark:hover:bg-slate-800 border border-stone-200 dark:border-slate-700 text-stone-700 dark:text-stone-200 font-medium text-sm transition flex items-center justify-center gap-2 shadow-sm"
          >
            <span>Conheça os Pilares da Jornada</span>
            <ChevronRight className="w-4 h-4 text-stone-400" />
          </a>
        </div>

        {/* CARTÕES DE SENSAÇÕES TERAPÊUTICAS */}
        <div className="mt-16 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto pt-10 border-t border-stone-200 dark:border-slate-800">
          <div className="p-4 rounded-3xl bg-white/60 dark:bg-slate-800/40 border border-stone-200/80 dark:border-slate-700/60 shadow-sm">
            <span className="block text-2xl font-serif font-medium text-teal-800 dark:text-teal-400">100%</span>
            <span className="text-xs text-stone-500 dark:text-stone-400 mt-1 block">Sigilo & Segurança</span>
          </div>
          <div className="p-4 rounded-3xl bg-white/60 dark:bg-slate-800/40 border border-stone-200/80 dark:border-slate-700/60 shadow-sm">
            <span className="block text-2xl font-serif font-medium text-stone-800 dark:text-stone-200">Sem Pressa</span>
            <span className="text-xs text-stone-500 dark:text-stone-400 mt-1 block">No seu próprio tempo</span>
          </div>
          <div className="p-4 rounded-3xl bg-white/60 dark:bg-slate-800/40 border border-stone-200/80 dark:border-slate-700/60 shadow-sm">
            <span className="block text-2xl font-serif font-medium text-amber-700 dark:text-amber-400">Memória</span>
            <span className="text-xs text-stone-500 dark:text-stone-400 mt-1 block">Evolução contínua</span>
          </div>
          <div className="p-4 rounded-3xl bg-white/60 dark:bg-slate-800/40 border border-stone-200/80 dark:border-slate-700/60 shadow-sm">
            <span className="block text-2xl font-serif font-medium text-stone-800 dark:text-stone-200">Zero</span>
            <span className="text-xs text-stone-500 dark:text-stone-400 mt-1 block">Julgamento ou crítica</span>
          </div>
        </div>
      </section>

      {/* 2. QUEM É IZAQUE E O QUE ELE FAZ POR VOCÊ */}
      <section id="quem-e-izaque" className="py-20 bg-stone-100/60 dark:bg-slate-800/30 border-y border-stone-200/80 dark:border-slate-800 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto space-y-16">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs font-semibold uppercase tracking-widest text-teal-800 dark:text-teal-400">
              A Proposta do Santuário
            </span>
            <h2 className="text-3xl sm:text-4xl font-serif font-normal text-stone-900 dark:text-stone-50">
              Um espaço para despir as armaduras do cotidiano.
            </h2>
            <p className="text-sm sm:text-base text-stone-600 dark:text-stone-300 font-serif leading-relaxed">
              Vivemos sob a pressão constante de sermos invencíveis. Aqui dentro, você pode respirar, admitir seus medos e desatar o que tem travado sua vida.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Pilar 1 */}
            <div className="p-8 rounded-4xl bg-white dark:bg-slate-800/80 border border-stone-200/80 dark:border-slate-700/70 shadow-sm space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-teal-700/10 dark:bg-teal-500/15 border border-teal-700/20 dark:border-teal-500/30 flex items-center justify-center text-teal-800 dark:text-teal-400">
                <Heart className="w-6 h-6 stroke-[1.75]" />
              </div>
              <h3 className="text-xl font-serif font-medium text-stone-900 dark:text-stone-100">
                Escuta Atenta e Contínua
              </h3>
              <p className="text-sm text-stone-600 dark:text-stone-300 font-serif leading-relaxed">
                Izaque recorda os seus medos, desabafos e metas de encontros anteriores. Cada conversa dá continuidade natural à sua história, sem você precisar recomeçar do zero.
              </p>
            </div>

            {/* Pilar 2 */}
            <div className="p-8 rounded-4xl bg-white dark:bg-slate-800/80 border border-stone-200/80 dark:border-slate-700/70 shadow-sm space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-700/10 dark:bg-amber-500/15 border border-amber-700/20 dark:border-amber-500/30 flex items-center justify-center text-amber-800 dark:text-amber-400">
                <Compass className="w-6 h-6 stroke-[1.75]" />
              </div>
              <h3 className="text-xl font-serif font-medium text-stone-900 dark:text-stone-100">
                Desarmamento de Bloqueios
              </h3>
              <p className="text-sm text-stone-600 dark:text-stone-300 font-serif leading-relaxed">
                Muitas vezes, a autossabotagem e o medo de prosperar vêm de crenças antigas de escassez e culpa. Izaque ajuda você a iluminar esses pontos cegos com clareza.
              </p>
            </div>

            {/* Pilar 3 */}
            <div className="p-8 rounded-4xl bg-white dark:bg-slate-800/80 border border-stone-200/80 dark:border-slate-700/70 shadow-sm space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-teal-700/10 dark:bg-teal-500/15 border border-teal-700/20 dark:border-teal-500/30 flex items-center justify-center text-teal-800 dark:text-teal-400">
                <Wind className="w-6 h-6 stroke-[1.75]" />
              </div>
              <h3 className="text-xl font-serif font-medium text-stone-900 dark:text-stone-100">
                Ação Serena e Firme
              </h3>
              <p className="text-sm text-stone-600 dark:text-stone-300 font-serif leading-relaxed">
                Chega de ansiedade paralisante. Cada encontro termina com passos práticos, leves e aplicáveis no mundo real para suas decisões financeiras, relacionamentos e carreira.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. COMO É UM ENCONTRO COM IZAQUE */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        <div className="space-y-12">
          <div className="text-center space-y-3">
            <span className="text-xs font-semibold uppercase tracking-widest text-teal-800 dark:text-teal-400">
              O Ritual de Encontro
            </span>
            <h2 className="text-3xl sm:text-4xl font-serif font-normal text-stone-900 dark:text-stone-50">
              Como funciona a sua sessão
            </h2>
          </div>

          <div className="space-y-4">
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-800/60 border border-stone-200/80 dark:border-slate-700/60 flex items-start gap-4 shadow-sm">
              <div className="w-8 h-8 rounded-full bg-teal-700/10 dark:bg-teal-500/15 flex items-center justify-center text-teal-800 dark:text-teal-400 font-serif font-semibold shrink-0 mt-0.5">
                1
              </div>
              <div>
                <h4 className="text-base font-serif font-medium text-stone-900 dark:text-stone-100">
                  Desabafe por escrito ou com sua própria voz
                </h4>
                <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 font-serif mt-1 leading-relaxed">
                  Fale sobre uma dúvida difícil, um medo que o paralisa ou uma situação que tirou o seu sono. Se preferir, aperte o microfone e desabafe em áudio sem se preocupar em editar suas palavras.
                </p>
              </div>
            </div>

            <div className="p-6 rounded-3xl bg-white dark:bg-slate-800/60 border border-stone-200/80 dark:border-slate-700/60 flex items-start gap-4 shadow-sm">
              <div className="w-8 h-8 rounded-full bg-teal-700/10 dark:bg-teal-500/15 flex items-center justify-center text-teal-800 dark:text-teal-400 font-serif font-semibold shrink-0 mt-0.5">
                2
              </div>
              <div>
                <h4 className="text-base font-serif font-medium text-stone-900 dark:text-stone-100">
                  Reflexão acolhedora e confronto respeitoso
                </h4>
                <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 font-serif mt-1 leading-relaxed">
                  Izaque não oferece clichês motivacionais vazios. Ele traz perguntas que fazem você enxergar as justificativas automáticas que você vinha contando a si mesmo.
                </p>
              </div>
            </div>

            <div className="p-6 rounded-3xl bg-white dark:bg-slate-800/60 border border-stone-200/80 dark:border-slate-700/60 flex items-start gap-4 shadow-sm">
              <div className="w-8 h-8 rounded-full bg-teal-700/10 dark:bg-teal-500/15 flex items-center justify-center text-teal-800 dark:text-teal-400 font-serif font-semibold shrink-0 mt-0.5">
                3
              </div>
              <div>
                <h4 className="text-base font-serif font-medium text-stone-900 dark:text-stone-100">
                  Um santuário personalizado com o nome que você escolher
                </h4>
                <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 font-serif mt-1 leading-relaxed">
                  O nome de origem é Izaque, mas no seu primeiro acesso você pode chamá-lo de Guia, Mentor ou o nome que trouxer mais paz ao seu coração.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. CONVITE FINAL DE ENTRADA NO SANTUÁRIO */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto text-center">
        <div className="p-10 sm:p-14 rounded-4xl bg-stone-100/90 dark:bg-slate-800/70 border border-stone-200 dark:border-slate-700 shadow-xl space-y-6">
          <div className="w-14 h-14 rounded-3xl bg-teal-700/10 dark:bg-teal-500/15 border border-teal-700/20 dark:border-teal-500/30 flex items-center justify-center text-teal-800 dark:text-teal-400 mx-auto">
            <Feather className="w-7 h-7 stroke-[1.75]" />
          </div>

          <h2 className="text-3xl sm:text-4xl font-serif font-normal text-stone-900 dark:text-stone-50 max-w-xl mx-auto">
            O primeiro passo para destravar é ter a coragem de desabafar.
          </h2>

          <p className="text-sm sm:text-base text-stone-600 dark:text-stone-300 font-serif max-w-md mx-auto leading-relaxed">
            Respire fundo. Não há nada a provar aqui dentro. Seu guia está pronto para ouvir o que você precisa dizer.
          </p>

          <div className="pt-2">
            <button
              onClick={onStartChat}
              className="px-9 py-4 rounded-2xl bg-teal-700 hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500 text-white font-medium text-sm tracking-wide shadow-xl shadow-teal-700/25 transition duration-300 inline-flex items-center gap-2"
            >
              <span>{user ? 'Entrar no Santuário' : 'Começar Minha Sessão Agora'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* RODAPÉ DISCRETO */}
      <footer className="py-8 border-t border-stone-200/80 dark:border-slate-800 text-center text-xs text-stone-400 dark:text-stone-500 font-serif">
        <p>Santuário IZAQUE • Espaço de Desaceleração, Escuta Atenta e Cura Emocional</p>
      </footer>
    </div>
  );
}
