import React, { useState, useEffect, useRef } from 'react';
import { supabase } from './services/supabase';
import Navbar from './components/Navbar';
import LandingPage from './components/LandingPage';
import ReflectionSpace from './components/ReflectionSpace';
import AdminDashboard from './components/AdminDashboard';
import AuthModal from './components/AuthModal';
import WelcomeOnboarding from './components/WelcomeOnboarding';
import UserProfileModal from './components/UserProfileModal';
import MobileBottomNav from './components/MobileBottomNav';
import UserSettingsModal from './components/UserSettingsModal';
import ResetPasswordModal from './components/ResetPasswordModal';
import SubscriptionModal from './components/SubscriptionModal';
import SubscriberFeedbackModal from './components/SubscriberFeedbackModal';
import { AlertTriangle, LifeBuoy } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [activeTab, setActiveTab] = useState('landing'); // 'landing' | 'chat' | 'admin'
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isResetPasswordOpen, setIsResetPasswordOpen] = useState(false);
  const [resetTokenHash, setResetTokenHash] = useState('');
  const [isSubscriptionOpen, setIsSubscriptionOpen] = useState(false);
  const [selectedInitialPlan, setSelectedInitialPlan] = useState('pro_monthly');
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);

  // Estado do Onboarding do Guia
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [guideName, setGuideName] = useState(() => {
    return localStorage.getItem('izaque_guide_name') || 'Izaque';
  });

  // Carregar perfil do usuário em public.izaque_profiles
  const loadUserProfile = async (currentUser) => {
    if (!currentUser) {
      setProfile(null);
      setLoadingProfile(false);
      return;
    }

    try {
      const { data } = await supabase
        .from('izaque_profiles')
        .select('*')
        .eq('id', currentUser.id)
        .maybeSingle();

      if (data) {
        setProfile(data);
        // Sincroniza preferências do banco de dados (Supabase) com o localStorage e estado local
        if (data.preferences && typeof data.preferences === 'object') {
          const p = data.preferences;
          if (p.guide_name) {
            localStorage.setItem('izaque_guide_name', p.guide_name);
            setGuideName(p.guide_name);
          }
          if (p.ambient_track) localStorage.setItem('izaque_ambient_track', p.ambient_track);
          if (p.ambient_volume !== undefined) localStorage.setItem('izaque_ambient_volume', p.ambient_volume.toString());
          if (p.ambient_enabled !== undefined) localStorage.setItem('izaque_ambient_enabled', p.ambient_enabled ? 'true' : 'false');
          if (p.immersive_voice !== undefined) localStorage.setItem('izaque_immersive_voice', p.immersive_voice ? 'true' : 'false');
          if (p.voice_engine) localStorage.setItem('izaque_voice_engine', p.voice_engine);
          if (p.gemini_voice) localStorage.setItem('izaque_gemini_voice', p.gemini_voice);
          if (p.voice_gender) localStorage.setItem('izaque_voice_gender', p.voice_gender);
          if (p.voice_rate !== undefined) localStorage.setItem('izaque_voice_rate', p.voice_rate.toString());
          if (p.voice_pitch !== undefined) localStorage.setItem('izaque_voice_pitch', p.voice_pitch.toString());
          if (p.voice_uri) localStorage.setItem('izaque_voice_uri', p.voice_uri);
          if (p.prefer_browser !== undefined) {
            localStorage.setItem('izaque_voice_prefer_browser', p.prefer_browser ? 'true' : 'false');
          }

          window.dispatchEvent(new Event('storage'));
        }
      } else {
        setProfile({
          id: currentUser.id,
          email: currentUser.email,
          full_name: currentUser.user_metadata?.full_name || currentUser.email.split('@')[0],
          role: currentUser.email === 'edsonmanoel2012@gmail.com' ? 'master' : 'user',
        });
      }
    } catch (err) {
      console.error('Erro ao carregar perfil:', err);
    } finally {
      setLoadingProfile(false);
    }
  };

  const activeTabRef = useRef(activeTab);
  useEffect(() => {
    activeTabRef.current = activeTab;
  }, [activeTab]);

  useEffect(() => {
    // Detecta se a URL contém instrução de recuperação de senha
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      const hash = window.location.hash || '';
      const tokenHash = searchParams.get('token_hash');
      if (tokenHash) {
        setResetTokenHash(tokenHash);
        setIsResetPasswordOpen(true);
      } else if (searchParams.get('mode') === 'reset-password' || hash.includes('type=recovery')) {
        setIsResetPasswordOpen(true);
      }
    }

    // 1. Obter sessão atual
    supabase.auth.getSession().then(({ data: { session } }) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        loadUserProfile(currentUser);
        // REQUISITO: Usuário autenticado já abre direto na página de conversa com IZAQUE
        setActiveTab('chat');
        // Verifica se é o primeiro acesso para exibir o onboarding
        const completed = localStorage.getItem('izaque_onboarding_completed');
        if (!completed) {
          setShowOnboarding(true);
        }
      } else {
        setLoadingProfile(false);
      }
    });

    // 2. Escutar mudanças de autenticação
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsResetPasswordOpen(true);
      }

      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        loadUserProfile(currentUser);
        const completed = localStorage.getItem('izaque_onboarding_completed');
        if (!completed) {
          setShowOnboarding(true);
        }
      } else {
        setProfile(null);
        if (activeTabRef.current === 'chat' || activeTabRef.current === 'admin') {
          setActiveTab('landing');
        }
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setActiveTab('landing');
  };

  const handleAuthSuccess = (loggedUser) => {
    setUser(loggedUser);
    loadUserProfile(loggedUser);
    const completed = localStorage.getItem('izaque_onboarding_completed');
    if (!completed) {
      setShowOnboarding(true);
    }
    setActiveTab('chat');
  };

  const handleCompleteOnboarding = (chosenName) => {
    setGuideName(chosenName);
    setShowOnboarding(false);
    // Dispara evento para o Navbar atualizar o nome instantaneamente
    window.dispatchEvent(new Event('storage'));
  };

  const handleStartChat = () => {
    if (!user) {
      setIsAuthOpen(true);
    } else {
      setActiveTab('chat');
    }
  };

  // BLOQUEIO DE ACESSO PELO SUPERADMIN
  if (user && profile && profile.is_active === false) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-stone-50 dark:bg-slate-900 text-stone-800 dark:text-stone-100 text-center font-sans">
        <div className="max-w-md p-8 sm:p-10 rounded-4xl bg-white dark:bg-slate-800 border border-stone-200 dark:border-slate-700 shadow-2xl space-y-4 animate-fadeIn">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto shadow-sm">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <h2 className="text-xl sm:text-2xl font-serif font-medium text-stone-900 dark:text-stone-50">
            Acesso Temporariamente Suspenso
          </h2>
          <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 font-serif leading-relaxed">
            O acesso ao seu refúgio pessoal está temporariamente inativo por decisão administrativa ou pendência cadastral.
          </p>
          <div className="pt-4 space-y-2.5">
            <a
              href="mailto:suporte@lynxems.com.br"
              className="w-full py-3.5 rounded-2xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold tracking-wide shadow-md shadow-teal-700/20 transition flex items-center justify-center gap-2"
            >
              <LifeBuoy className="w-4 h-4" />
              <span>Falar com o Suporte Oficial</span>
            </a>
            <button
              onClick={handleLogout}
              className="w-full py-2.5 rounded-2xl bg-stone-100 dark:bg-slate-700 hover:bg-stone-200 dark:hover:bg-slate-600 text-xs font-medium text-stone-600 dark:text-stone-300 transition"
            >
              Encerrar Sessão
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`bg-stone-50 dark:bg-slate-900 text-stone-800 dark:text-stone-100 flex flex-col font-sans selection:bg-teal-700/20 selection:text-teal-900 dark:selection:text-teal-200 transition-colors duration-300 ${
        activeTab === 'chat' ? 'h-[100dvh] max-h-[100dvh] overflow-hidden' : 'min-h-[100dvh] pb-20 md:pb-0'
      }`}
    >
      {/* ONBOARDING DO GUIA (Primeiro Acesso) */}
      {showOnboarding && (
        <WelcomeOnboarding
          userName={profile?.full_name || user?.email?.split('@')[0] || 'Viajante'}
          onComplete={handleCompleteOnboarding}
        />
      )}

      {/* NAVBAR DO SANTUÁRIO - No celular esconde durante o chat para evitar cabeçalho duplo e ganhar espaço */}
      <div className={activeTab === 'chat' ? 'hidden md:block shrink-0' : 'shrink-0'}>
        <Navbar
          user={user}
          profile={profile}
          activeTab={activeTab}
          setActiveTab={(tab) => {
            if ((tab === 'chat' || tab === 'admin') && !user) {
              setIsAuthOpen(true);
              return;
            }
            setActiveTab(tab);
          }}
          onOpenAuth={() => setIsAuthOpen(true)}
          onLogout={handleLogout}
          onOpenOnboarding={() => setShowOnboarding(true)}
          onOpenProfile={() => setIsProfileOpen(true)}
          onOpenSubscription={(planId) => {
            if (typeof planId === 'string') setSelectedInitialPlan(planId);
            else setSelectedInitialPlan('pro_monthly');
            if (!user) {
              setIsAuthOpen(true);
            } else {
              setIsSubscriptionOpen(true);
            }
          }}
          onOpenFeedback={() => setIsFeedbackOpen(true)}
        />
      </div>

      {/* ROTEAMENTO PRINCIPAL */}
      <main className={`flex-1 flex flex-col ${activeTab === 'chat' ? 'min-h-0 overflow-hidden' : ''}`}>
        {activeTab === 'landing' && (
          <LandingPage
            onStartChat={handleStartChat}
            user={user}
            onOpenSubscription={(planId) => {
              setSelectedInitialPlan(planId || 'pro_monthly');
              if (!user) {
                setIsAuthOpen(true);
              } else {
                setIsSubscriptionOpen(true);
              }
            }}
          />
        )}

        {activeTab === 'chat' && (
          <>
            {user ? (
              <ReflectionSpace
                user={profile || user}
                onEditGuideName={() => setShowOnboarding(true)}
                onBackToHome={() => setActiveTab('landing')}
              />
            ) : (
              <div className="flex-1 flex items-center justify-center p-6 text-center">
                <div className="max-w-md p-8 rounded-4xl bg-white dark:bg-slate-800/80 border border-stone-200 dark:border-slate-700 shadow-xl space-y-4">
                  <h3 className="text-xl font-serif font-medium text-stone-900 dark:text-stone-100">
                    Sua Mentoria Pessoal
                  </h3>
                  <p className="text-sm text-stone-500 dark:text-stone-400 leading-relaxed">
                    Para que seus momentos de reflexão e desenvolvimento fiquem guardados com total sigilo e continuidade, entre na sua conta.
                  </p>
                  <button
                    onClick={() => setIsAuthOpen(true)}
                    className="w-full py-3.5 rounded-2xl bg-teal-700 hover:bg-teal-800 text-white font-medium text-xs tracking-wide shadow-md shadow-teal-700/20 transition"
                  >
                    Acessar Mentoria
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {activeTab === 'admin' && (
          <>
            {profile?.role === 'master' || profile?.role === 'admin' ? (
              <AdminDashboard currentUser={profile} />
            ) : (
              <div className="flex-1 flex items-center justify-center p-6 text-center">
                <div className="max-w-md p-8 rounded-4xl bg-white dark:bg-slate-800 border border-stone-200 dark:border-slate-700">
                  <h3 className="text-xl font-serif font-medium text-rose-600 dark:text-rose-400 mb-2">
                    Acesso Reservado
                  </h3>
                  <p className="text-sm text-stone-500 dark:text-stone-400 mb-6">
                    Esta área é exclusiva para a administração do ecossistema.
                  </p>
                  <button
                    onClick={() => setActiveTab('landing')}
                    className="px-6 py-2.5 rounded-xl bg-stone-200 dark:bg-slate-700 hover:bg-stone-300 font-medium text-xs transition"
                  >
                    Voltar para a Mentoria
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* MODAL DE ENTRADA / CADASTRO */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={handleAuthSuccess}
      />

      {/* MODAL DE REDEFINIÇÃO DE SENHA (RECUPERAÇÃO VIA E-MAIL OFICIAL) */}
      <ResetPasswordModal
        isOpen={isResetPasswordOpen}
        tokenHash={resetTokenHash}
        onClose={() => {
          setIsResetPasswordOpen(false);
          setResetTokenHash('');
        }}
        onOpenForgot={() => setIsAuthOpen(true)}
      />

      {/* MODAL DE PERFIL DO USUÁRIO (FOTO, NOME, WHATSAPP) */}
      {user && (
        <UserProfileModal
          isOpen={isProfileOpen}
          onClose={() => setIsProfileOpen(false)}
          user={user}
          profile={profile}
          onProfileUpdated={(updated) => setProfile(updated)}
        />
      )}

      {/* MODAL DE AJUSTES E PREFERÊNCIAS SENSORIAIS (SOM & VOZ) */}
      <UserSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        user={user}
        profile={profile}
        onProfileUpdated={(updated) => setProfile(updated)}
        onGuideNameChanged={(newName) => {
          setGuideName(newName);
          window.dispatchEvent(new Event('storage'));
        }}
      />

      {/* MENU INFERIOR FIXO PARA CELULARES E TABLETS (BOTTOM NAVIGATION BAR) */}
      <MobileBottomNav
        activeTab={activeTab}
        onNavigate={(tab) => {
          if ((tab === 'chat' || tab === 'admin') && !user) {
            setIsAuthOpen(true);
            return;
          }
          setActiveTab(tab);
        }}
        onOpenProfile={() => {
          if (!user) {
            setIsAuthOpen(true);
          } else {
            setIsProfileOpen(true);
          }
        }}
        onOpenSettings={() => setIsSettingsOpen(true)}
        user={user}
        profile={profile}
      />

      {/* MODAL DE PLANOS & ASSINATURAS PIX */}
      <SubscriptionModal
        isOpen={isSubscriptionOpen}
        onClose={() => setIsSubscriptionOpen(false)}
        user={user}
        profile={profile}
        initialPlanId={selectedInitialPlan}
        onPlanUpdated={() => {
          if (user) loadUserProfile(user);
        }}
      />

      {/* MODAL DE SUPORTE, SUGESTÕES E RECLAMAÇÕES LYNX */}
      <SubscriberFeedbackModal
        isOpen={isFeedbackOpen}
        onClose={() => setIsFeedbackOpen(false)}
        user={user}
        profile={profile}
      />
    </div>
  );
}
