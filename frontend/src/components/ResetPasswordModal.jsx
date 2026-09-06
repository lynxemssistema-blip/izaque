import React, { useState } from 'react';
import { supabase } from '../services/supabase';
import { Lock, Check, AlertCircle, Feather, ArrowRight, X } from 'lucide-react';

export default function ResetPasswordModal({ isOpen, onClose }) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleReset = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (newPassword.length < 6) {
      setErrorMsg('A nova senha deve conter pelo menos 6 caracteres.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('As senhas não coincidem. Digite a mesma senha em ambos os campos.');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      setSuccess(true);
      setTimeout(() => {
        // Limpa parâmetros de hash da URL
        if (window.history?.replaceState) {
          window.history.replaceState(null, '', window.location.pathname);
        }
        onClose();
      }, 2000);
    } catch (err) {
      console.error('Erro ao atualizar senha:', err);
      setErrorMsg(err.message || 'Erro ao redefinir senha. Tente solicitar um novo link.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md p-6 sm:p-9 bg-stone-50 dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-3xl sm:rounded-4xl shadow-2xl text-stone-800 dark:text-stone-100">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 rounded-full hover:bg-stone-200/50 dark:hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-teal-700/10 dark:bg-teal-500/15 border border-teal-700/20 dark:border-teal-500/30 mb-3 text-teal-800 dark:text-teal-400 shadow-sm">
            <Feather className="w-6 h-6 stroke-[1.75]" />
          </div>
          <h2 className="text-xl sm:text-2xl font-serif font-medium tracking-tight text-stone-900 dark:text-stone-50">
            Definir Nova Senha
          </h2>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 font-serif">
            Crie sua nova credencial segura para acessar o santuário IZAQUE
          </p>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {success ? (
          <div className="p-4 rounded-2xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 text-teal-800 dark:text-teal-300 text-center space-y-2">
            <div className="w-10 h-10 rounded-full bg-teal-700 text-white flex items-center justify-center mx-auto">
              <Check className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-sm">Senha Atualizada com Sucesso!</h3>
            <p className="text-xs text-teal-700/80 dark:text-teal-300/80">
              Você já está autenticado. Redirecionando para suas reflexões...
            </p>
          </div>
        ) : (
          <form onSubmit={handleReset} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
                Nova Senha
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-stone-400" />
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full pl-10 pr-4 py-3 rounded-2xl bg-white dark:bg-slate-800 border border-stone-300 dark:border-slate-700 focus:border-teal-700 text-sm placeholder-stone-400 outline-none transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
                Confirmar Nova Senha
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-stone-400" />
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repita a nova senha"
                  className="w-full pl-10 pr-4 py-3 rounded-2xl bg-white dark:bg-slate-800 border border-stone-300 dark:border-slate-700 focus:border-teal-700 text-sm placeholder-stone-400 outline-none transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3.5 rounded-2xl bg-teal-700 hover:bg-teal-800 text-white font-medium text-sm tracking-wide shadow-md shadow-teal-700/20 transition flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95"
            >
              <span>{loading ? 'Atualizando senha...' : 'Salvar Nova Senha'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
