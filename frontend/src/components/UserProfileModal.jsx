import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  User,
  Phone,
  Mail,
  Camera,
  Check,
  AlertCircle,
  ShieldCheck,
  Sparkles,
  Loader2,
} from 'lucide-react';
import { updateUserProfile, uploadUserAvatar } from '../services/api';

export default function UserProfileModal({ isOpen, onClose, user, profile, onProfileUpdated }) {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setFullName(profile?.full_name || user?.user_metadata?.full_name || '');
      setPhone(profile?.phone || user?.user_metadata?.phone || '');
      setAvatarUrl(profile?.avatar_url || user?.user_metadata?.avatar_url || '');
      setFeedbackMsg('');
      setErrorMsg('');
    }
  }, [isOpen, profile, user]);

  if (!isOpen) return null;

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMsg('Por favor, selecione um arquivo de imagem válido (JPG, PNG, WebP).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg('A imagem deve ter no máximo 5MB.');
      return;
    }

    try {
      setUploadingAvatar(true);
      setErrorMsg('');

      // Preview instantâneo local
      const objectUrl = URL.createObjectURL(file);
      setAvatarUrl(objectUrl);

      // Upload para o Supabase Storage (bucket avatars)
      const publicUrl = await uploadUserAvatar(user.id, file);
      setAvatarUrl(publicUrl);
      setFeedbackMsg('Foto carregada! Clique em "Salvar Alterações" para confirmar.');
    } catch (err) {
      console.error('Erro no upload da foto:', err);
      setErrorMsg('Não foi possível carregar a imagem. Verifique a conexão.');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSave = async (e) => {
    e?.preventDefault();
    if (!user?.id) return;

    try {
      setSaving(true);
      setErrorMsg('');
      setFeedbackMsg('');

      const res = await updateUserProfile(user.id, {
        full_name: fullName.trim(),
        phone: phone.trim(),
        avatar_url: avatarUrl.trim(),
      });

      setFeedbackMsg('Perfil atualizado com tranquilidade!');
      if (onProfileUpdated) {
        onProfileUpdated({
          ...(profile || {}),
          full_name: fullName.trim(),
          phone: phone.trim(),
          avatar_url: avatarUrl.trim(),
        });
      }

      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      console.error('Erro ao salvar perfil:', err);
      setErrorMsg(err.message || 'Erro ao salvar alterações no perfil.');
    } finally {
      setSaving(false);
    }
  };

  const getInitials = () => {
    const name = fullName || user?.email || 'V';
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg p-6 sm:p-8 bg-stone-50 dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-3xl sm:rounded-4xl shadow-2xl text-stone-800 dark:text-stone-100 max-h-[90vh] overflow-y-auto">
        {/* BOTÃO FECHAR */}
        <button
          onClick={onClose}
          type="button"
          className="absolute top-5 right-5 p-2 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 rounded-full hover:bg-stone-200/50 dark:hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* CABEÇALHO */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 dark:bg-teal-950/60 border border-teal-200/80 dark:border-teal-800/40 text-teal-800 dark:text-teal-300 text-xs font-serif mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Refúgio Pessoal & Identidade</span>
          </div>
          <h2 className="text-2xl font-serif font-medium tracking-tight text-stone-900 dark:text-stone-50">
            Meu Perfil
          </h2>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 font-serif">
            Personalize como o IZAQUE e os mentores acolhem e se comunicam com você
          </p>
        </div>

        {/* FEEDBACKS */}
        {feedbackMsg && (
          <div className="mb-4 p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2 animate-fadeIn">
            <Check className="w-4 h-4 shrink-0" />
            <span>{feedbackMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="mb-4 p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2 animate-fadeIn">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-5">
          {/* SEÇÃO DA FOTO / AVATAR */}
          <div className="flex flex-col items-center justify-center gap-3">
            <div className="relative group">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full border-4 border-white dark:border-slate-800 shadow-md overflow-hidden bg-teal-700/10 dark:bg-teal-500/20 flex items-center justify-center text-teal-800 dark:text-teal-300 font-serif text-2xl">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="Foto de perfil"
                    className="w-full h-full object-cover"
                    onError={() => setAvatarUrl('')}
                  />
                ) : (
                  <span>{getInitials()}</span>
                )}
              </div>

              {/* Botão de Câmera sobreposto */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingAvatar}
                title="Alterar foto de perfil"
                className="absolute bottom-0 right-0 p-2.5 rounded-full bg-teal-700 hover:bg-teal-800 text-white shadow-lg transition-transform transform hover:scale-105 active:scale-95 flex items-center justify-center border-2 border-white dark:border-slate-800"
              >
                {uploadingAvatar ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Camera className="w-4 h-4" />
                )}
              </button>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />

            <span className="text-[11px] text-stone-500 dark:text-stone-400 font-serif">
              Toque na câmera para carregar uma foto do seu dispositivo
            </span>
          </div>

          {/* NOME DE EXIBIÇÃO */}
          <div>
            <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1.5 font-serif">
              Nome de Exibição
            </label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3.5 top-3.5 text-stone-400" />
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Como prefere ser chamado?"
                className="w-full pl-10 pr-4 py-3 rounded-2xl bg-white dark:bg-slate-800 border border-stone-300 dark:border-slate-700 focus:border-teal-700 dark:focus:border-teal-400 focus:ring-1 focus:ring-teal-700 text-sm text-stone-800 dark:text-stone-100 placeholder-stone-400 outline-none transition shadow-sm"
              />
            </div>
            <span className="text-[10px] text-stone-400 dark:text-stone-500 mt-1 block">
              Usado nas saudações personalizadas e diálogos empáticos dos mentores.
            </span>
          </div>

          {/* TELEFONE / WHATSAPP */}
          <div>
            <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1.5 font-serif">
              Número de Telefone / WhatsApp
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 absolute left-3.5 top-3.5 text-stone-400" />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(DDD) 99999-9999"
                className="w-full pl-10 pr-4 py-3 rounded-2xl bg-white dark:bg-slate-800 border border-stone-300 dark:border-slate-700 focus:border-teal-700 dark:focus:border-teal-400 focus:ring-1 focus:ring-teal-700 text-sm text-stone-800 dark:text-stone-100 placeholder-stone-400 outline-none transition shadow-sm"
              />
            </div>
            <span className="text-[10px] text-stone-400 dark:text-stone-500 mt-1 block">
              Opcional. Permite receber alertas de reflexões diárias ou suporte exclusivo.
            </span>
          </div>

          {/* E-MAIL (SOMENTE LEITURA) */}
          <div>
            <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1.5 font-serif">
              E-mail de Acesso
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3.5 top-3.5 text-stone-400" />
              <input
                type="email"
                disabled
                value={user?.email || ''}
                className="w-full pl-10 pr-4 py-3 rounded-2xl bg-stone-100 dark:bg-slate-800/50 border border-stone-200 dark:border-slate-700 text-sm text-stone-500 dark:text-stone-400 outline-none cursor-not-allowed"
              />
            </div>
          </div>

          {/* NIVEL / ROLE */}
          <div className="p-3.5 rounded-2xl bg-stone-100/70 dark:bg-slate-800/40 border border-stone-200/80 dark:border-slate-700/60 flex items-center justify-between text-xs">
            <span className="font-serif text-stone-600 dark:text-stone-300">
              Nível de Acesso na Mentoria:
            </span>
            <span className="px-2.5 py-0.5 rounded-full font-serif font-medium bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 border border-teal-200/60 dark:border-teal-800/40 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              {profile?.role === 'master'
                ? 'Super Administrador (Master)'
                : profile?.role === 'admin'
                ? 'Administrador'
                : 'Membro da Mentoria'}
            </span>
          </div>

          {/* BOTÃO SALVAR */}
          <button
            type="submit"
            disabled={saving || uploadingAvatar}
            className="w-full py-3.5 rounded-2xl bg-teal-700 hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500 text-white font-medium text-sm tracking-wide shadow-md shadow-teal-700/20 transition flex items-center justify-center gap-2 disabled:opacity-50 min-h-[46px]"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Guardando dados...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>Salvar Alterações</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
