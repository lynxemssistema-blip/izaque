import React from 'react';
import { Home, MessageSquareHeart, User, Sliders, Shield, Heart } from 'lucide-react';

export default function MobileBottomNav({
  activeTab,
  onNavigate,
  onOpenProfile,
  onOpenSettings,
  user,
  profile,
}) {
  const isMasterOrAdmin = profile?.role === 'master' || profile?.role === 'admin';
  const guideName = localStorage.getItem('izaque_guide_name') || 'IZAQUE';

  return (
    <nav
      className={`md:hidden z-30 bg-stone-50/95 dark:bg-slate-900/95 backdrop-blur-xl border-t border-stone-200/80 dark:border-slate-800 pb-safe pt-1 px-2 shadow-xl transition-colors ${
        activeTab === 'chat' ? 'w-full shrink-0 relative' : 'fixed bottom-0 left-0 right-0'
      }`}
    >
      <div className="flex items-center justify-around max-w-lg mx-auto py-1">
        {/* INÍCIO */}
        <button
          type="button"
          onClick={() => onNavigate('landing')}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-2xl transition min-w-[56px] min-h-[48px] ${
            activeTab === 'landing'
              ? 'text-teal-800 dark:text-teal-400 font-medium'
              : 'text-stone-400 dark:text-stone-500 hover:text-stone-700 dark:hover:text-stone-300'
          }`}
        >
          <div
            className={`p-1 rounded-xl transition ${
              activeTab === 'landing' ? 'bg-teal-700/10 dark:bg-teal-500/20' : ''
            }`}
          >
            <Home className="w-5 h-5 stroke-[1.75]" />
          </div>
          <span className="text-[10px] font-serif mt-0.5">Início</span>
        </button>

        {/* SESSÃO DE CHAT COM IZAQUE */}
        <button
          type="button"
          onClick={() => onNavigate('chat')}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-2xl transition min-w-[56px] min-h-[48px] ${
            activeTab === 'chat'
              ? 'text-teal-800 dark:text-teal-400 font-medium'
              : 'text-stone-400 dark:text-stone-500 hover:text-stone-700 dark:hover:text-stone-300'
          }`}
        >
          <div
            className={`p-1 rounded-xl transition relative ${
              activeTab === 'chat' ? 'bg-teal-700/10 dark:bg-teal-500/20' : ''
            }`}
          >
            <MessageSquareHeart className="w-5 h-5 stroke-[1.75]" />
            <span className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full bg-teal-600 dark:bg-teal-400 animate-pulse" />
          </div>
          <span className="text-[10px] font-serif mt-0.5">Sessão</span>
        </button>

        {/* MEU PERFIL */}
        <button
          type="button"
          onClick={onOpenProfile}
          className="flex flex-col items-center justify-center py-1 px-2.5 rounded-2xl transition min-w-[56px] min-h-[48px] text-stone-400 dark:text-stone-500 hover:text-stone-700 dark:hover:text-stone-300"
        >
          <div className="p-1 rounded-xl transition">
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt="Avatar"
                className="w-5 h-5 rounded-full object-cover border border-stone-300 dark:border-slate-700"
              />
            ) : (
              <User className="w-5 h-5 stroke-[1.75]" />
            )}
          </div>
          <span className="text-[10px] font-serif mt-0.5">Perfil</span>
        </button>

        {/* PREFERÊNCIAS SENSORIAIS (VOZ & AMBIENTE) */}
        <button
          type="button"
          onClick={onOpenSettings}
          className="flex flex-col items-center justify-center py-1 px-2.5 rounded-2xl transition min-w-[56px] min-h-[48px] text-stone-400 dark:text-stone-500 hover:text-stone-700 dark:hover:text-stone-300"
        >
          <div className="p-1 rounded-xl transition">
            <Sliders className="w-5 h-5 stroke-[1.75]" />
          </div>
          <span className="text-[10px] font-serif mt-0.5">Ajustes</span>
        </button>

        {/* SUPER ADMIN (CONDICIONAL) */}
        {isMasterOrAdmin && (
          <button
            type="button"
            onClick={() => onNavigate('admin')}
            className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-2xl transition min-w-[56px] min-h-[48px] ${
              activeTab === 'admin'
                ? 'text-amber-700 dark:text-amber-400 font-medium'
                : 'text-amber-600/70 dark:text-amber-500/70 hover:text-amber-700'
            }`}
          >
            <div
              className={`p-1 rounded-xl transition ${
                activeTab === 'admin' ? 'bg-amber-500/10 dark:bg-amber-500/20' : ''
              }`}
            >
              <Shield className="w-5 h-5 stroke-[1.75]" />
            </div>
            <span className="text-[10px] font-serif mt-0.5">Admin</span>
          </button>
        )}
      </div>
    </nav>
  );
}
