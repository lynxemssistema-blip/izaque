import React, { useState } from 'react';
import { supabase } from '../services/supabase';
import { requestPasswordReset } from '../services/api';
import { X, Lock, Mail, User, Feather, AlertCircle, ArrowRight, CheckCircle2, LifeBuoy } from 'lucide-react';

export default function AuthModal({ isOpen, onClose, onSuccess }) {
  // 'login' | 'signup' | 'forgot'
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [forgotSuccessMsg, setForgotSuccessMsg] = useState('');

  if (!isOpen) return null;

  const handleModeChange = (newMode) => {
    setMode(newMode);
    setErrorMsg('');
    setForgotSuccessMsg('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setForgotSuccessMsg('');
    setLoading(true);

    try {
      if (mode === 'login') {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) throw error;
        onSuccess(data.user);
        onClose();
      } else if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: { full_name: fullName.trim() },
          },
        });
        if (error) throw error;
        onSuccess(data.user);
        onClose();
      } else if (mode === 'forgot') {
        if (!email || !email.includes('@')) {
          setErrorMsg('Por favor, digite um e-mail válido.');
          setLoading(false);
          return;
        }
        const res = await requestPasswordReset(email.trim());
        setForgotSuccessMsg(
          res.message || 'Link de recuperação enviado com sucesso para o seu e-mail!'
        );
      }
    } catch (err) {
      console.error('Erro no fluxo de autenticação:', err);
      setErrorMsg(err.message || 'Ocorreu um erro ao processar sua solicitação.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-stone-900/60 backdrop-blur-md pt-safe animate-fadeIn">
      <div className="relative w-full max-w-md p-6 sm:p-9 bg-stone-50 dark:bg-slate-900 border-t sm:border border-stone-200 dark:border-slate-800 rounded-t-3xl sm:rounded-4xl shadow-2xl text-stone-800 dark:text-stone-100 max-h-[92dvh] overflow-y-auto overscroll-contain pb-safe sm:pb-9">
        {/* Barra de Arraste visual (Mobile Native Pull-bar) */}
        <div className="w-12 h-1 bg-stone-300 dark:bg-slate-700 rounded-full mx-auto mb-3 sm:hidden" />

        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 rounded-full hover:bg-stone-200/50 dark:hover:bg-slate-800 transition min-w-[36px] min-h-[36px] flex items-center justify-center"
          title="Fechar"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Cabeçalho */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-teal-700/10 dark:bg-teal-500/15 border border-teal-700/20 dark:border-teal-500/30 mb-3 text-teal-800 dark:text-teal-400 shadow-sm">
            <Feather className="w-6 h-6 stroke-[1.75]" />
          </div>
          <h2 className="text-xl sm:text-2xl font-serif font-medium tracking-tight text-stone-900 dark:text-stone-50">
            {mode === 'login' && 'Acessar Mentoria'}
            {mode === 'signup' && 'Iniciar Sua Jornada'}
            {mode === 'forgot' && 'Recuperar Acesso'}
          </h2>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 font-serif leading-relaxed">
            {mode === 'login' && 'Conecte-se para continuar seus momentos de reflexão e escuta'}
            {mode === 'signup' && 'Dê o primeiro passo para desatar bloqueios com tranquilidade'}
            {mode === 'forgot' && 'Enviaremos um link seguro para o seu e-mail redefinir a senha'}
          </p>
        </div>

        {/* Mensagem de Erro */}
        {errorMsg && (
          <div className="mb-4 p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2 animate-fadeIn">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Mensagem de Sucesso na Recuperação */}
        {forgotSuccessMsg && (
          <div className="mb-4 p-4 rounded-2xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 text-teal-800 dark:text-teal-300 text-xs space-y-2 animate-fadeIn">
            <div className="flex items-center gap-2 font-semibold text-sm">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-teal-600 dark:text-teal-400" />
              <span>Link Enviado com Sucesso!</span>
            </div>
            <p className="leading-relaxed">
              Verifique a caixa de entrada (e a pasta de spam) de <strong>{email}</strong> para redefinir sua senha com um clique.
            </p>
            <p className="text-[11px] text-teal-700/80 dark:text-teal-400/80 pt-1 border-t border-teal-200/60 dark:border-teal-800/60">
              Canal de suporte oficial: <strong>suporte@lynxems.com.br</strong>
            </p>
          </div>
        )}

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <div>
              <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
                Nome Completo
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3.5 top-3.5 text-stone-400" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Como você gostaria de ser chamado?"
                  className="w-full pl-10 pr-4 py-3 rounded-2xl bg-white dark:bg-slate-800 border border-stone-300 dark:border-slate-700 focus:border-teal-700 text-base sm:text-sm placeholder-stone-400 outline-none transition"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
              Seu E-mail
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3.5 top-3.5 text-stone-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                className="w-full pl-10 pr-4 py-3 rounded-2xl bg-white dark:bg-slate-800 border border-stone-300 dark:border-slate-700 focus:border-teal-700 text-base sm:text-sm placeholder-stone-400 outline-none transition"
              />
            </div>
          </div>

          {mode !== 'forgot' && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-medium text-stone-700 dark:text-stone-300">
                  Senha de Acesso
                </label>
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={() => handleModeChange('forgot')}
                    className="text-xs text-teal-700 dark:text-teal-400 hover:text-teal-800 dark:hover:text-teal-300 hover:underline transition"
                  >
                    Esqueceu a senha?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-stone-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-3 rounded-2xl bg-white dark:bg-slate-800 border border-stone-300 dark:border-slate-700 focus:border-teal-700 text-base sm:text-sm placeholder-stone-400 outline-none transition"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3.5 rounded-2xl bg-teal-700 hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500 text-white font-medium text-sm tracking-wide shadow-md shadow-teal-700/20 transition duration-150 flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95 min-h-[44px]"
          >
            {loading ? (
              <span>
                {mode === 'forgot' ? 'Enviando link seguro...' : 'Processando com cuidado...'}
              </span>
            ) : (
              <>
                <span>
                  {mode === 'login' && 'Acessar Mentoria'}
                  {mode === 'signup' && 'Iniciar Minha Jornada'}
                  {mode === 'forgot' && 'Enviar Link de Recuperação'}
                </span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Alternância de Telas */}
        <div className="mt-5 pt-4 border-t border-stone-200 dark:border-slate-800 flex flex-col items-center gap-2 text-xs">
          {mode === 'login' && (
            <button
              type="button"
              onClick={() => handleModeChange('signup')}
              className="text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 py-1"
            >
              Não tem conta? <span className="font-semibold text-teal-700 dark:text-teal-400">Crie aqui</span>
            </button>
          )}

          {mode === 'signup' && (
            <button
              type="button"
              onClick={() => handleModeChange('login')}
              className="text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 py-1"
            >
              Já tem refúgio? <span className="font-semibold text-teal-700 dark:text-teal-400">Entrar</span>
            </button>
          )}

          {mode === 'forgot' && (
            <button
              type="button"
              onClick={() => handleModeChange('login')}
              className="text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 py-1"
            >
              Lembrou sua senha? <span className="font-semibold text-teal-700 dark:text-teal-400">Voltar ao Login</span>
            </button>
          )}

          {/* Rodapé de Suporte Oficial */}
          <div className="pt-3 flex items-center justify-center gap-1.5 text-[11px] text-stone-400 dark:text-slate-500">
            <LifeBuoy className="w-3.5 h-3.5" />
            <span>Suporte oficial:</span>
            <a
              href="mailto:suporte@lynxems.com.br"
              className="text-teal-700 dark:text-teal-400 hover:underline font-medium"
            >
              suporte@lynxems.com.br
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
