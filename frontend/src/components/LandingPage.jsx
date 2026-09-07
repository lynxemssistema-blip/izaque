import React, { useState, useEffect } from 'react';
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
  Check,
  QrCode,
  Clock,
  Shield,
} from 'lucide-react';
import { fetchPublicPlans } from '../services/api';

export default function LandingPage({ onStartChat, user, onOpenSubscription }) {
  const [plans, setPlans] = useState([]);

  useEffect(() => {
    fetchPublicPlans()
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setPlans(data);
        }
      })
      .catch((err) => console.warn('Aviso ao carregar planos na landing:', err));
  }, []);

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-slate-900 text-stone-800 dark:text-stone-100 overflow-x-hidden transition-colors duration-300 font-sans selection:bg-teal-700/20 selection:text-teal-900 dark:selection:text-teal-200">
      {/* GLOW DECORATIVO SUAVE & ORGÂNICO (Sem tons neon/cibernéticos) */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[640px] overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[-15%] left-1/4 w-[550px] h-[450px] bg-teal-600/10 dark:bg-teal-500/10 blur-[130px] rounded-full" />
        <div className="absolute top-[-5%] right-1/4 w-[480px] h-[380px] bg-amber-600/10 dark:bg-amber-500/10 blur-[120px] rounded-full" />
      </div>

      {/* 1. SEÇÃO PRINCIPAL (HERO) */}
      <section className="relative pt-12 sm:pt-28 pb-14 sm:pb-20 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto text-center">
        {/* Pílula de Acolhimento */}
        <div className="inline-flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 px-3.5 sm:px-4 py-1.5 rounded-full bg-stone-200/70 dark:bg-slate-800/80 border border-stone-300/60 dark:border-slate-700/80 text-[11px] sm:text-xs text-stone-600 dark:text-stone-300 mb-6 sm:mb-8 backdrop-blur-md shadow-sm">
          <span className="flex h-2 w-2 rounded-full bg-teal-600 dark:bg-teal-400 animate-pulse" />
          <span className="font-serif font-medium text-teal-800 dark:text-teal-300">
            Mentoria de Clareza & Desenvolvimento
          </span>
          <span className="hidden sm:inline">•</span>
          <span className="hidden sm:inline">Um espaço seguro para desacelerar e se reencontrar</span>
        </div>

        {/* Título Principal Humanizado */}
        <h1 className="text-3xl sm:text-5xl lg:text-7xl font-serif font-normal tracking-tight text-stone-900 dark:text-stone-50 max-w-4xl mx-auto leading-[1.18]">
          Desate os nós da sua mente.{' '}
          <span className="italic font-medium text-teal-800 dark:text-teal-300">
            Cure a hesitação.
          </span>{' '}
          Reencontre sua paz e direção.
        </h1>

        {/* Descrição Apresentando Izaque */}
        <p className="mt-5 sm:mt-6 text-sm sm:text-lg lg:text-xl text-stone-600 dark:text-stone-300 max-w-2xl mx-auto leading-relaxed font-serif">
          Conheça <strong>Izaque</strong>: um mentor de presença calma e escuta profunda, dedicado a ajudar você a compreender bloqueios emocionais, quebrar ciclos de autossabotagem e reconstruir a confiança no seu caminho.
        </p>

        {/* Chamadas para Ação */}
        <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 w-full max-w-md sm:max-w-none mx-auto">
          <button
            onClick={onStartChat}
            className="w-full sm:w-auto px-7 sm:px-9 py-3.5 sm:py-4 rounded-2xl bg-teal-700 hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500 text-white font-medium text-sm tracking-wide shadow-xl shadow-teal-700/25 transition-all duration-300 transform active:scale-95 sm:hover:-translate-y-0.5 flex items-center justify-center gap-2.5 sm:gap-3"
          >
            <Feather className="w-4 h-4 stroke-[2]" />
            <span>{user ? 'Acessar Minha Mentoria' : 'Conversar com Izaque'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <a
            href="#planos"
            className="w-full sm:w-auto px-6 sm:px-8 py-3.5 sm:py-4 rounded-2xl bg-white/80 dark:bg-slate-800/80 hover:bg-white dark:hover:bg-slate-800 border border-stone-200 dark:border-slate-700 text-stone-700 dark:text-stone-200 font-medium text-sm transition flex items-center justify-center gap-2 shadow-sm active:scale-95"
          >
            <span>Conhecer os Planos</span>
            <ChevronRight className="w-4 h-4 text-stone-400" />
          </a>
        </div>

        {/* CARTÕES DE SENSAÇÕES TERAPÊUTICAS */}
        <div className="mt-12 sm:mt-16 grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-4 max-w-3xl mx-auto pt-8 sm:pt-10 border-t border-stone-200 dark:border-slate-800">
          <div className="p-3.5 sm:p-4 rounded-2xl sm:rounded-3xl bg-white/60 dark:bg-slate-800/40 border border-stone-200/80 dark:border-slate-700/60 shadow-sm">
            <span className="block text-xl sm:text-2xl font-serif font-medium text-teal-800 dark:text-teal-400">100%</span>
            <span className="text-[11px] sm:text-xs text-stone-500 dark:text-stone-400 mt-0.5 sm:mt-1 block">Sigilo & Segurança</span>
          </div>
          <div className="p-3.5 sm:p-4 rounded-2xl sm:rounded-3xl bg-white/60 dark:bg-slate-800/40 border border-stone-200/80 dark:border-slate-700/60 shadow-sm">
            <span className="block text-xl sm:text-2xl font-serif font-medium text-stone-800 dark:text-stone-200">Sem Pressa</span>
            <span className="text-[11px] sm:text-xs text-stone-500 dark:text-stone-400 mt-0.5 sm:mt-1 block">No seu próprio tempo</span>
          </div>
          <div className="p-3.5 sm:p-4 rounded-2xl sm:rounded-3xl bg-white/60 dark:bg-slate-800/40 border border-stone-200/80 dark:border-slate-700/60 shadow-sm">
            <span className="block text-xl sm:text-2xl font-serif font-medium text-amber-700 dark:text-amber-400">Memória</span>
            <span className="text-[11px] sm:text-xs text-stone-500 dark:text-stone-400 mt-0.5 sm:mt-1 block">Evolução contínua</span>
          </div>
          <div className="p-3.5 sm:p-4 rounded-2xl sm:rounded-3xl bg-white/60 dark:bg-slate-800/40 border border-stone-200/80 dark:border-slate-700/60 shadow-sm">
            <span className="block text-xl sm:text-2xl font-serif font-medium text-stone-800 dark:text-stone-200">Zero</span>
            <span className="text-[11px] sm:text-xs text-stone-500 dark:text-stone-400 mt-0.5 sm:mt-1 block">Julgamento ou crítica</span>
          </div>
        </div>
      </section>

      {/* 2. QUEM É IZAQUE E O QUE ELE FAZ POR VOCÊ */}
      <section id="quem-e-izaque" className="py-20 bg-stone-100/60 dark:bg-slate-800/30 border-y border-stone-200/80 dark:border-slate-800 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto space-y-16">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs font-semibold uppercase tracking-widest text-teal-800 dark:text-teal-400">
              A Proposta da Mentoria
            </span>
            <h2 className="text-2xl sm:text-4xl lg:text-5xl font-serif font-normal text-stone-900 dark:text-stone-50 tracking-tight">
              Uma presença que caminha ao seu lado
            </h2>
            <p className="text-xs sm:text-base text-stone-600 dark:text-stone-300 font-serif leading-relaxed">
              Não se trata de respostas prontas, mas de conversas que iluminam suas próprias conclusões através de três pilares:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-800/80 border border-stone-200/80 dark:border-slate-700/80 shadow-sm space-y-4">
              <div className="w-10 h-10 rounded-2xl bg-teal-700/10 dark:bg-teal-500/15 border border-teal-700/20 dark:border-teal-500/30 flex items-center justify-center text-teal-800 dark:text-teal-400">
                <Heart className="w-5 h-5 stroke-[1.75]" />
              </div>
              <h3 className="text-lg font-serif font-medium text-stone-900 dark:text-stone-100">
                Escuta Profunda & Atenção
              </h3>
              <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 font-serif leading-relaxed">
                Um porto seguro para você expressar angústias e pensamentos sem o receio de ser rotulado ou criticado.
              </p>
            </div>

            <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-800/80 border border-stone-200/80 dark:border-slate-700/80 shadow-sm space-y-4">
              <div className="w-10 h-10 rounded-2xl bg-amber-600/10 dark:bg-amber-500/15 border border-amber-600/20 dark:border-amber-500/30 flex items-center justify-center text-amber-700 dark:text-amber-400">
                <Compass className="w-5 h-5 stroke-[1.75]" />
              </div>
              <h3 className="text-lg font-serif font-medium text-stone-900 dark:text-stone-100">
                Clareza nos Momentos de Dúvida
              </h3>
              <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 font-serif leading-relaxed">
                Perguntas cuidadosas que ajudam a desembaraçar decisões complexas e devolver o foco no que realmente importa.
              </p>
            </div>

            <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-800/80 border border-stone-200/80 dark:border-slate-700/80 shadow-sm space-y-4">
              <div className="w-10 h-10 rounded-2xl bg-teal-800/10 dark:bg-teal-600/15 border border-teal-800/20 dark:border-teal-600/30 flex items-center justify-center text-teal-900 dark:text-teal-300">
                <ShieldCheck className="w-5 h-5 stroke-[1.75]" />
              </div>
              <h3 className="text-lg font-serif font-medium text-stone-900 dark:text-stone-100">
                Constância & Memória
              </h3>
              <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 font-serif leading-relaxed">
                Izaque recorda suas vitórias e os pontos em que você costuma hesitar, oferecendo uma linha contínua de evolução.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. COMO FUNCIONA A EXPERIÊNCIA */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
        <div className="space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs font-semibold uppercase tracking-widest text-teal-800 dark:text-teal-400">
              Passo a Passo
            </span>
            <h2 className="text-2xl sm:text-4xl lg:text-5xl font-serif font-normal text-stone-900 dark:text-stone-50 tracking-tight">
              Como funciona o seu momento
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-800/60 border border-stone-200/80 dark:border-slate-700/60 flex items-start gap-4 shadow-sm">
              <div className="w-8 h-8 rounded-full bg-teal-700/10 dark:bg-teal-500/15 flex items-center justify-center text-teal-800 dark:text-teal-400 font-serif font-semibold shrink-0 mt-0.5">
                1
              </div>
              <div>
                <h4 className="text-base font-serif font-medium text-stone-900 dark:text-stone-100">
                  Sem formulários cansativos
                </h4>
                <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 font-serif mt-1 leading-relaxed">
                  Você simplesmente abre o espaço e compartilha o que está no seu coração: em texto ou gravando um áudio calmo.
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
                  Personalização com o nome que escolher
                </h4>
                <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 font-serif mt-1 leading-relaxed">
                  O nome de origem é Izaque, mas você pode chamá-lo de Guia, Mentor ou o nome que trouxer mais clareza ao seu coração.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. SEÇÃO DE PLANOS & ASSINATURA (SOLICITADA PELO USUÁRIO) */}
      <section id="planos" className="py-20 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto scroll-mt-12">
        <div className="text-center max-w-2xl mx-auto space-y-3 mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-teal-50 dark:bg-teal-950/60 border border-teal-200/80 dark:border-teal-800/40 text-xs font-serif text-teal-800 dark:text-teal-300">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Planos de Mentoria & Santuário</span>
          </div>
          <h2 className="text-2xl sm:text-4xl lg:text-5xl font-serif font-normal text-stone-900 dark:text-stone-50 tracking-tight">
            Escolha como deseja caminhar
          </h2>
          <p className="text-xs sm:text-base text-stone-600 dark:text-stone-300 font-serif leading-relaxed">
            Sem pressa e sem cobranças surpresas. Todos os planos contam com total sigilo, escuta respeitosa e desenvolvimento contínuo.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 items-stretch">
          {/* CARD 1: GRATUITO (DEGUSTAÇÃO / ACOLHIMENTO) */}
          <div className="p-6 sm:p-8 rounded-3xl sm:rounded-4xl bg-white dark:bg-slate-800/60 border border-stone-200/80 dark:border-slate-700/60 shadow-sm flex flex-col justify-between hover:shadow-md transition">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                  Refúgio Inicial
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-stone-100 dark:bg-slate-700 text-stone-600 dark:text-stone-300">
                  Gratuito
                </span>
              </div>

              <h3 className="text-xl font-serif font-medium text-stone-900 dark:text-stone-100 mb-2">
                Acolhimento
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400 font-serif mb-6 leading-relaxed">
                Ideal para conhecer Izaque e desfrutar de reflexões pontuais sem compromisso.
              </p>

              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-xs text-stone-400 font-medium">R$</span>
                <span className="text-3xl sm:text-4xl font-serif font-semibold text-stone-900 dark:text-stone-50">
                  0
                </span>
                <span className="text-xs text-stone-500 dark:text-stone-400">/sempre</span>
              </div>

              <ul className="space-y-3 text-xs text-stone-600 dark:text-stone-300 mb-6">
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                  <span>Sessões iniciais para desabafar</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                  <span>Voz nativa do navegador</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                  <span>Sons essenciais (432Hz e Chuva)</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                  <span>Ambiente sigiloso e acolhedor</span>
                </li>
              </ul>
            </div>

            <button
              type="button"
              onClick={onStartChat}
              className="w-full py-3 rounded-2xl bg-stone-200/80 hover:bg-stone-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-stone-800 dark:text-stone-100 font-medium text-xs transition active:scale-95 flex items-center justify-center gap-1.5"
            >
              <span>Experimentar Gratuitamente</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* CARD 2: PLANO MENSAL */}
          {(() => {
            const monthlyPlan = plans.find((p) => p.id === 'pro_monthly') || {
              id: 'pro_monthly',
              name: 'Caminho da Paz (Mensal)',
              price: 29.9,
              description: 'Refúgio diário com voz neural imersiva e memória profunda.',
              features: [
                'Conversas diárias sem restrições',
                'Voz neural realista do Gemini (Charon e Aoede)',
                'Memória contínua com histórico completo',
                'Todas as frequências sonoras meditativas',
                'Canal exclusivo de suporte direto Lynx',
              ],
            };

            return (
              <div className="relative p-6 sm:p-8 rounded-3xl sm:rounded-4xl bg-white dark:bg-slate-800 border-2 border-teal-700 dark:border-teal-600 shadow-xl flex flex-col justify-between transform md:-translate-y-2">
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-teal-700 text-white shadow-sm">
                  Mais Flexível
                </span>

                <div>
                  <div className="flex items-center justify-between mb-4 mt-1">
                    <span className="text-xs font-semibold uppercase tracking-wider text-teal-800 dark:text-teal-300">
                      Plano Mensal
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 border border-teal-200">
                      Sem fidelidade
                    </span>
                  </div>

                  <h3 className="text-xl font-serif font-medium text-stone-900 dark:text-stone-100 mb-2">
                    {monthlyPlan.name}
                  </h3>
                  <p className="text-xs text-stone-500 dark:text-stone-400 font-serif mb-6 leading-relaxed">
                    {monthlyPlan.description}
                  </p>

                  <div className="flex items-baseline gap-1 mb-6">
                    <span className="text-xs text-stone-400 font-medium">R$</span>
                    <span className="text-3xl sm:text-4xl font-serif font-semibold text-stone-900 dark:text-stone-50">
                      {Number(monthlyPlan.price).toFixed(2).replace('.', ',')}
                    </span>
                    <span className="text-xs text-stone-500 dark:text-stone-400">/mês</span>
                  </div>

                  <ul className="space-y-3 text-xs text-stone-600 dark:text-stone-300 mb-6">
                    {(Array.isArray(monthlyPlan.features) ? monthlyPlan.features : []).map((feat, idx) => (
                      <li key={idx} className="flex items-start gap-2.5">
                        <Check className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  type="button"
                  onClick={() => onOpenSubscription && onOpenSubscription('pro_monthly')}
                  className="w-full py-3.5 rounded-2xl bg-teal-700 hover:bg-teal-800 text-white font-medium text-xs tracking-wide shadow-md shadow-teal-700/25 transition active:scale-95 flex items-center justify-center gap-1.5"
                >
                  <QrCode className="w-3.5 h-3.5" />
                  <span>Assinar Mensal via PIX</span>
                </button>
              </div>
            );
          })()}

          {/* CARD 3: PLANO ANUAL */}
          {(() => {
            const annualPlan = plans.find((p) => p.id === 'pro_annual') || {
              id: 'pro_annual',
              name: 'Santuário Pleno (Anual)',
              price: 247.0,
              description: 'A experiência máxima de mentoria com desconto de 30% e benefícios exclusivos.',
              features: [
                'Tudo do Plano Mensal por 1 ano inteiro',
                'Economia de mais de 30% no valor anual',
                'Voz neural ilimitada para todas as reflexões',
                'Prioridade nos modelos neurais mais rápidos',
                'Canal de suporte e sugestões prioritário Lynx',
              ],
            };

            return (
              <div className="relative p-6 sm:p-8 rounded-3xl sm:rounded-4xl bg-white dark:bg-slate-800/60 border border-amber-300 dark:border-amber-800/60 shadow-sm flex flex-col justify-between hover:shadow-md transition">
                <span className="absolute -top-3 right-6 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-600 text-white shadow-sm">
                  ⭐ Economize 30%
                </span>

                <div>
                  <div className="flex items-center justify-between mb-4 mt-1">
                    <span className="text-xs font-semibold uppercase tracking-wider text-amber-800 dark:text-amber-300">
                      Plano Anual
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200">
                      Melhor Custo
                    </span>
                  </div>

                  <h3 className="text-xl font-serif font-medium text-stone-900 dark:text-stone-100 mb-2">
                    {annualPlan.name}
                  </h3>
                  <p className="text-xs text-stone-500 dark:text-stone-400 font-serif mb-6 leading-relaxed">
                    {annualPlan.description}
                  </p>

                  <div className="flex items-baseline gap-1 mb-6">
                    <span className="text-xs text-stone-400 font-medium">R$</span>
                    <span className="text-3xl sm:text-4xl font-serif font-semibold text-stone-900 dark:text-stone-50">
                      {Number(annualPlan.price).toFixed(2).replace('.', ',')}
                    </span>
                    <span className="text-xs text-stone-500 dark:text-stone-400">/ano</span>
                  </div>

                  <ul className="space-y-3 text-xs text-stone-600 dark:text-stone-300 mb-6">
                    {(Array.isArray(annualPlan.features) ? annualPlan.features : []).map((feat, idx) => (
                      <li key={idx} className="flex items-start gap-2.5">
                        <Check className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  type="button"
                  onClick={() => onOpenSubscription && onOpenSubscription('pro_annual')}
                  className="w-full py-3.5 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-medium text-xs tracking-wide shadow-md shadow-amber-600/20 transition active:scale-95 flex items-center justify-center gap-1.5"
                >
                  <QrCode className="w-3.5 h-3.5" />
                  <span>Assinar Anual via PIX</span>
                </button>
              </div>
            );
          })()}
        </div>

        {/* AVISO DE ATIVAÇÃO DE ATÉ 10 MINUTOS NA LANDING */}
        <div className="mt-8 sm:mt-10 p-4 rounded-2xl sm:rounded-3xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/60 max-w-2xl mx-auto flex items-center gap-3 text-center sm:text-left text-xs text-amber-900 dark:text-amber-200 leading-relaxed justify-center">
          <Clock className="w-4 h-4 text-amber-700 dark:text-amber-400 shrink-0 hidden sm:block" />
          <span>
            ⏳ <strong>Informação importante:</strong> Os pagamentos são processados exclusivamente via <strong>PIX</strong>. A ativação do plano pode demorar <strong>até 10 minutos</strong> após a realização do pagamento para liberação pelo sistema.
          </span>
        </div>
      </section>

      {/* 5. CONVITE FINAL DE ENTRADA NA MENTORIA */}
      <section className="py-14 sm:py-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto text-center">
        <div className="p-6 sm:p-14 rounded-3xl sm:rounded-4xl bg-stone-100/90 dark:bg-slate-800/70 border border-stone-200 dark:border-slate-700 shadow-xl space-y-5 sm:space-y-6">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl sm:rounded-3xl bg-teal-700/10 dark:bg-teal-500/15 border border-teal-700/20 dark:border-teal-500/30 flex items-center justify-center text-teal-800 dark:text-teal-400 mx-auto">
            <Feather className="w-6 h-6 sm:w-7 sm:h-7 stroke-[1.75]" />
          </div>

          <h2 className="text-2xl sm:text-4xl font-serif font-normal text-stone-900 dark:text-stone-50 max-w-xl mx-auto leading-snug">
            O primeiro passo para destravar é ter a coragem de desabafar.
          </h2>

          <p className="text-xs sm:text-base text-stone-600 dark:text-stone-300 font-serif max-w-md mx-auto leading-relaxed">
            Respire fundo. Não há nada a provar aqui dentro. Seu mentor está pronto para ouvir o que você precisa dizer.
          </p>

          <div className="pt-2">
            <button
              onClick={onStartChat}
              className="w-full sm:w-auto px-7 sm:px-9 py-3.5 sm:py-4 rounded-2xl bg-teal-700 hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500 text-white font-medium text-sm tracking-wide shadow-xl shadow-teal-700/25 transition duration-300 inline-flex items-center justify-center gap-2 active:scale-95"
            >
              <span>{user ? 'Acessar Mentoria' : 'Começar Minha Sessão Agora'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* RODAPÉ DISCRETO */}
      <footer className="py-8 px-4 border-t border-stone-200/80 dark:border-slate-800 text-center text-xs text-stone-400 dark:text-stone-500 font-serif">
        <p>Mentoria IZAQUE • Espaço de Clareza, Escuta Atenta e Desenvolvimento Pessoal</p>
      </footer>
    </div>
  );
}
