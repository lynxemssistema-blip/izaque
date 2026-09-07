import React, { useState, useEffect } from 'react';
import { Feather, Shield, Wind, LogOut, Heart, Home, Edit3, Sparkles, LifeBuoy } from 'lucide-react';

export default function Navbar({
  user,
  profile,
  activeTab,
  setActiveTab,
  onOpenAuth,
  onLogout,
  onOpenOnboarding,
  onOpenProfile,
  onOpenSubscription,
  onOpenFeedback,
}) {
  const isMasterOrAdmin = profile?.role === 'master' || profile?.role === 'admin';
  const isSubscriber = profile?.plan_id && profile?.plan_id !== 'free';
  const [guideName, setGuideName] = useState(() => {
    return localStorage.getItem('izaque_guide_name') || 'Izaque';
  });

  // Atualiza o nome caso mude
  useEffect(() => {
    const handleStorage = () => {
      setGuideName(localStorage.getItem('izaque_guide_name') || 'Izaque');
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const getInitials = () => {
    const name = profile?.full_name || user?.email || 'V';
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-stone-200/80 dark:border-slate-800 bg-stone-50/90 dark:bg-slate-900/90 backdrop-blur-xl transition-colors">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2">
        {/* LOGO DO SANTUÁRIO */}
        <div
          onClick={() => setActiveTab('landing')}
          className="flex items-center space-x-2.5 sm:space-x-3 cursor-pointer group min-w-0"
        >
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-teal-700/10 dark:bg-teal-500/15 border border-teal-700/20 dark:border-teal-500/30 flex items-center justify-center text-teal-800 dark:text-teal-400 shadow-sm group-hover:scale-105 transition-transform shrink-0">
            <Feather className="w-4 h-4 sm:w-5 sm:h-5 stroke-[1.75]" />
          </div>
          <div className="min-w-0">
            <span className="text-base sm:text-lg font-serif font-medium tracking-tight text-stone-900 dark:text-stone-50 flex items-center gap-1.5 truncate">
              Mentoria
              <span className="hidden sm:inline-block text-[10px] font-sans font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 border border-teal-200/80 dark:border-teal-800/40">
                Clareza & Direção
              </span>
            </span>
            <p className="hidden sm:block text-[10px] text-stone-500 dark:text-stone-400 -mt-0.5 truncate">
              Escuta atenta e desenvolvimento pessoal
            </p>
          </div>
        </div>

        {/* NAVEGAÇÃO CENTRAL TERAPÊUTICA */}
        <nav className="hidden md:flex items-center space-x-1 bg-stone-200/50 dark:bg-slate-800/50 p-1.5 rounded-2xl border border-stone-300/50 dark:border-slate-700/50">
          <button
            onClick={() => setActiveTab('landing')}
            className={`px-4 py-1.5 rounded-xl text-xs font-medium transition flex items-center gap-1.5 ${
              activeTab === 'landing'
                ? 'bg-white dark:bg-slate-700 text-stone-900 dark:text-white shadow-sm'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
            }`}
          >
            <Home className="w-3.5 h-3.5" />
            Início
          </button>

          <button
            onClick={() => {
              if (!user) {
                onOpenAuth();
              } else {
                setActiveTab('chat');
              }
            }}
            className={`px-4 py-1.5 rounded-xl text-xs font-medium transition flex items-center gap-1.5 ${
              activeTab === 'chat'
                ? 'bg-teal-700 dark:bg-teal-600 text-white shadow-sm'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
            }`}
          >
            <Wind className="w-3.5 h-3.5" />
            Sessão com {guideName}
            {!user && (
              <span className="text-[9px] bg-stone-300 dark:bg-slate-700 text-stone-700 dark:text-stone-300 px-1.5 py-0.2 rounded">
                Entrar
              </span>
            )}
          </button>

          {isMasterOrAdmin && (
            <button
              onClick={() => setActiveTab('admin')}
              className={`px-4 py-1.5 rounded-xl text-xs font-medium transition flex items-center gap-1.5 ${
                activeTab === 'admin'
                  ? 'bg-amber-600 text-white font-medium shadow-sm'
                  : 'text-amber-700 dark:text-amber-400 hover:text-amber-800'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              Super Admin
            </button>
          )}

          {/* BOTÃO DE PLANOS & ASSINATURA */}
          <button
            type="button"
            onClick={onOpenSubscription}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition flex items-center gap-1.5 ${
              isSubscriber
                ? 'text-amber-700 dark:text-amber-400 hover:text-amber-800 font-serif'
                : 'bg-teal-700/10 dark:bg-teal-500/20 text-teal-800 dark:text-teal-300 hover:bg-teal-700/20'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span>{isSubscriber ? 'Assinante Ativo' : 'Santuário Pleno'}</span>
          </button>
        </nav>

        {/* ÁREA DO USUÁRIO OU ENTRADA */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Botão Mobile para Planos */}
          <button
            type="button"
            onClick={onOpenSubscription}
            className="md:hidden p-2 text-amber-600 dark:text-amber-400 hover:bg-stone-200/60 dark:hover:bg-slate-800 rounded-xl transition"
            title="Planos & Assinaturas"
          >
            <Sparkles className="w-4 h-4" />
          </button>

          {user ? (
            <div className="flex items-center space-x-2 sm:space-x-3">
              {/* Botão de Suporte Oficial Lynx (Sugestões & Reclamações) */}
              <button
                type="button"
                onClick={onOpenFeedback}
                title="Suporte Oficial Lynx (Sugestões ou Reclamações)"
                className="p-2 text-stone-500 hover:text-teal-700 dark:hover:text-teal-400 hover:bg-stone-200/60 dark:hover:bg-slate-800 rounded-xl transition"
              >
                <LifeBuoy className="w-4 h-4" />
              </button>

              {/* Botão de Perfil com Avatar */}
              <button
                type="button"
                onClick={onOpenProfile}
                title="Visualizar e editar seu perfil"
                className="flex items-center gap-2 p-1 sm:px-2.5 sm:py-1 rounded-2xl hover:bg-stone-200/60 dark:hover:bg-slate-800 transition text-left"
              >
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-teal-700/10 dark:bg-teal-500/20 border border-teal-700/20 dark:border-teal-500/30 overflow-hidden flex items-center justify-center text-teal-800 dark:text-teal-300 font-serif text-xs font-semibold shrink-0">
                  {profile?.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt="Avatar"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span>{getInitials()}</span>
                  )}
                </div>

                <div className="hidden sm:flex flex-col text-left">
                  <span className="text-xs font-medium text-stone-800 dark:text-stone-200 truncate max-w-[120px]">
                    {profile?.full_name || user.email?.split('@')[0]}
                  </span>
                  <span className="text-[10px] text-teal-700 dark:text-teal-400">
                    Meu Perfil
                  </span>
                </div>
              </button>

              {onOpenOnboarding && (
                <button
                  type="button"
                  onClick={onOpenOnboarding}
                  title="Alterar o nome do seu Guia"
                  className="p-2 text-stone-500 hover:text-teal-700 dark:hover:text-teal-400 hover:bg-stone-200/60 dark:hover:bg-slate-800 rounded-xl transition"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
              )}

              <button
                onClick={onLogout}
                title="Sair com segurança"
                className="p-2 text-stone-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-stone-200/60 dark:hover:bg-slate-800 rounded-xl transition"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-2xl bg-teal-700 hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500 text-white text-xs font-medium tracking-wide shadow-md shadow-teal-700/20 transition flex items-center gap-1.5 shrink-0"
            >
              <Heart className="w-3.5 h-3.5" />
              <span>Acessar Mentoria</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
