import React, { useState, useEffect } from 'react';
import {
  SlidersHorizontal,
  Eye,
  EyeOff,
  Palette,
  Sliders,
  Volume2,
  Sparkles,
  Save,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  ShieldCheck,
  Music,
  Mic,
  Cpu,
  RotateCcw,
} from 'lucide-react';
import { fetchSystemSettings, updateSystemSettings } from '../services/adminApi';
import { THEMES } from '../services/themeService';
import { GEMINI_VOICES } from '../services/voiceService';

export default function AdminSystemSettings({ currentUser }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  // Estado dos parâmetros
  const [settings, setSettings] = useState({
    id: 'global',
    show_theme_selector: true,
    show_settings_button: true,
    show_ambient_sound_button: true,
    default_theme: 'gold',
    default_guide_name: 'Izaque',
    default_ambient_track: '432hz',
    default_ambient_volume: 0.20,
    default_ambient_enabled: false,
    default_voice_engine: 'gemini',
    default_gemini_voice: 'Charon',
    default_immersive_voice: false,
    updated_at: null,
  });

  const loadSettings = async () => {
    try {
      setLoading(true);
      const data = await fetchSystemSettings();
      if (data) {
        setSettings((prev) => ({
          ...prev,
          ...data,
          // Garante fallback se vier nulo do banco
          default_theme: data.default_theme || 'gold',
        }));
      }
    } catch (err) {
      console.error('Erro ao carregar configurações do sistema:', err);
      showFeedback('error', 'Falha ao carregar parâmetros do sistema.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const showFeedback = (type, message) => {
    setFeedback({ type, message });
    setTimeout(() => {
      setFeedback({ type: '', message: '' });
    }, 4000);
  };

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    try {
      setSaving(true);
      const updated = await updateSystemSettings({
        ...settings,
        updated_by: currentUser?.id || 'superadmin',
      });
      setSettings(updated);
      showFeedback('success', 'Parâmetros avançados salvos com sucesso!');

      // Notifica o app na mesma janela para atualizar a interface em tempo real
      window.dispatchEvent(new CustomEvent('system-settings-updated', { detail: updated }));
    } catch (err) {
      console.error('Erro ao salvar parâmetros:', err);
      showFeedback('error', 'Erro ao salvar alterações: ' + (err.message || 'Falha na conexão'));
    } finally {
      setSaving(false);
    }
  };

  // Restaura os padrões oficiais recomendados da conta do Edson
  const handleResetToEdsonDefault = () => {
    setSettings((prev) => ({
      ...prev,
      show_theme_selector: false,
      show_settings_button: false,
      show_ambient_sound_button: true,
      default_theme: 'gold',
      default_guide_name: 'Izaque',
      default_ambient_track: '432hz',
      default_ambient_volume: 0.20,
      default_ambient_enabled: false,
      default_voice_engine: 'gemini',
      default_gemini_voice: 'Charon',
      default_immersive_voice: false,
    }));
    showFeedback('info', 'Padrão do Edson aplicado! Clique em "Salvar Parâmetros" para confirmar.');
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-3">
        <RefreshCw className="w-8 h-8 animate-spin text-amber-500" />
        <span className="text-sm font-serif text-stone-500">Carregando parâmetros avançados do sistema...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* HEADER DA SEÇÃO */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-amber-500/10 via-amber-600/5 to-transparent border border-amber-500/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 shadow-sm">
            <SlidersHorizontal className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-serif font-medium text-stone-900 dark:text-stone-50">
                Parâmetros Avançados do Sistema
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/30 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                Exclusivo Superadmin
              </span>
            </div>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 max-w-2xl leading-relaxed">
              Configure quais controles aparecem na interface de sessão do usuário com o Izaque e defina os estilos e ajustes padrão herdados da conta de Edson Manoel para toda a plataforma.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleResetToEdsonDefault}
            title="Preencher com os padrões aprovados da conta do Edson"
            className="px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-stone-50 dark:hover:bg-slate-700 text-stone-700 dark:text-stone-200 text-xs font-medium transition flex items-center gap-1.5 shadow-sm active:scale-95 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-500" />
            <span>Padrão Edson</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold tracking-wide transition flex items-center gap-2 shadow-md shadow-amber-600/20 active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            {saving ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>{saving ? 'Gravando...' : 'Salvar Parâmetros'}</span>
          </button>
        </div>
      </div>

      {/* FEEDBACK MENSAGEM */}
      {feedback.message && (
        <div
          className={`p-4 rounded-2xl flex items-center gap-3 text-xs font-medium transition animate-fadeIn ${
            feedback.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
              : feedback.type === 'info'
              ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
              : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800'
          }`}
        >
          {feedback.type === 'success' && <CheckCircle className="w-4 h-4 shrink-0" />}
          {feedback.type === 'info' && <Sparkles className="w-4 h-4 shrink-0" />}
          {feedback.type === 'error' && <AlertCircle className="w-4 h-4 shrink-0" />}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* GRID DE CONFIGURAÇÕES */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* BLOCO 1: VISIBILIDADE DE ELEMENTOS NA TELA DE SESSÃO */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-800/90 border border-stone-200/80 dark:border-slate-700 shadow-sm space-y-6">
          <div className="flex items-center gap-2.5 pb-3 border-b border-stone-200 dark:border-slate-700">
            <div className="p-2 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400">
              <Eye className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-serif font-medium text-stone-900 dark:text-stone-100">
                Visibilidade na Sessão (Interface do Usuário)
              </h3>
              <p className="text-xs text-stone-400">
                Defina quais botões ficam visíveis no cabeçalho da sessão com o Izaque para os membros.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {/* TOGGLE 1: SELETOR DE ESTILOS VISUAIS */}
            <div className="p-4 rounded-2xl bg-stone-50 dark:bg-slate-900/60 border border-stone-200/80 dark:border-slate-700 flex items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 mt-0.5">
                  <Palette className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-stone-800 dark:text-stone-100 flex items-center gap-2">
                    Botão de Estilos Visuais (Temas)
                    {settings.show_theme_selector ? (
                      <span className="text-[10px] font-normal text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/60 px-2 py-0.2 rounded-full">
                        Visível
                      </span>
                    ) : (
                      <span className="text-[10px] font-normal text-stone-500 bg-stone-200 dark:bg-slate-700 px-2 py-0.2 rounded-full">
                        Oculto
                      </span>
                    )}
                  </h4>
                  <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5 leading-relaxed">
                    Permite que o usuário clique no botão de paleta no cabeçalho e troque o tema da interface (Esmeralda, Ouro, Índigo, Terracota).
                  </p>
                </div>
              </div>

              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={settings.show_theme_selector}
                  onChange={(e) =>
                    setSettings((prev) => ({ ...prev, show_theme_selector: e.target.checked }))
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-stone-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
              </label>
            </div>

            {/* TOGGLE 2: BOTÃO DE AJUSTES */}
            <div className="p-4 rounded-2xl bg-stone-50 dark:bg-slate-900/60 border border-stone-200/80 dark:border-slate-700 flex items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 mt-0.5">
                  <Sliders className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-stone-800 dark:text-stone-100 flex items-center gap-2">
                    Botão de Ajustes (Preferências)
                    {settings.show_settings_button ? (
                      <span className="text-[10px] font-normal text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/60 px-2 py-0.2 rounded-full">
                        Visível
                      </span>
                    ) : (
                      <span className="text-[10px] font-normal text-stone-500 bg-stone-200 dark:bg-slate-700 px-2 py-0.2 rounded-full">
                        Oculto
                      </span>
                    )}
                  </h4>
                  <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5 leading-relaxed">
                    Exibe o botão "Ajustes" no cabeçalho da sessão, permitindo que o usuário altere nome do mentor, som ambiente e opções de voz.
                  </p>
                </div>
              </div>

              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={settings.show_settings_button}
                  onChange={(e) =>
                    setSettings((prev) => ({ ...prev, show_settings_button: e.target.checked }))
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-stone-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
              </label>
            </div>

            {/* TOGGLE 3: BOTÃO DE SOM AMBIENTE */}
            <div className="p-4 rounded-2xl bg-stone-50 dark:bg-slate-900/60 border border-stone-200/80 dark:border-slate-700 flex items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 mt-0.5">
                  <Volume2 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-stone-800 dark:text-stone-100 flex items-center gap-2">
                    Botão de Som Ambiente Terapêutico
                    {settings.show_ambient_sound_button ? (
                      <span className="text-[10px] font-normal text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/60 px-2 py-0.2 rounded-full">
                        Visível
                      </span>
                    ) : (
                      <span className="text-[10px] font-normal text-stone-500 bg-stone-200 dark:bg-slate-700 px-2 py-0.2 rounded-full">
                        Oculto
                      </span>
                    )}
                  </h4>
                  <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5 leading-relaxed">
                    Exibe o botão de tocar/pausar frequências sonoras (432Hz ou Chuva) direto no topo da sessão de reflexão.
                  </p>
                </div>
              </div>

              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={settings.show_ambient_sound_button}
                  onChange={(e) =>
                    setSettings((prev) => ({ ...prev, show_ambient_sound_button: e.target.checked }))
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-stone-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>
          </div>
        </div>

        {/* BLOCO 2: PADRONIZAÇÃO GLOBAL DO SISTEMA (HERDADO DO EDSON) */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-800/90 border border-stone-200/80 dark:border-slate-700 shadow-sm space-y-6">
          <div className="flex items-center gap-2.5 pb-3 border-b border-stone-200 dark:border-slate-700">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-serif font-medium text-stone-900 dark:text-stone-100">
                Padrão Global Herdado da Conta do Edson
              </h3>
              <p className="text-xs text-stone-400">
                Estilo e ajustes aplicados imediatamente a todos os usuários do sistema.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {/* SELEÇÃO DO ESTILO VISUAL PADRÃO */}
            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-2">
                Estilo Visual Padrão da Plataforma
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {THEMES.map((theme) => {
                  const isSelected = settings.default_theme === theme.id;
                  const isEdsonActive = theme.id === 'gold';
                  return (
                    <button
                      key={theme.id}
                      type="button"
                      onClick={() => setSettings((prev) => ({ ...prev, default_theme: theme.id }))}
                      className={`p-3 rounded-2xl border text-left transition relative flex flex-col justify-between ${
                        isSelected
                          ? 'bg-amber-500/10 border-amber-500 ring-2 ring-amber-500/30'
                          : 'bg-stone-50 dark:bg-slate-900/60 border-stone-200 dark:border-slate-700 hover:border-stone-300'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-base">{theme.previewIcon}</span>
                          <span className="text-xs font-semibold text-stone-900 dark:text-stone-100">
                            {theme.name}
                          </span>
                        </div>
                        <div
                          className="w-3.5 h-3.5 rounded-full shrink-0 border border-white/50"
                          style={{ backgroundColor: theme.accent }}
                        />
                      </div>
                      <span className="text-[10px] text-stone-500 dark:text-stone-400 block truncate">
                        {theme.tagline}
                      </span>
                      {isEdsonActive && (
                        <span className="mt-2 inline-flex items-center text-[9px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider bg-amber-100 dark:bg-amber-950/60 px-1.5 py-0.2 rounded-md self-start">
                          ✨ Ativo na conta do Edson
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* VOZ NEURAL DO GEMINI PADRÃO */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1 flex items-center gap-1.5">
                  <Mic className="w-3.5 h-3.5 text-teal-600" />
                  Voz Padrão (Gemini Neural)
                </label>
                <select
                  value={settings.default_gemini_voice}
                  onChange={(e) =>
                    setSettings((prev) => ({ ...prev, default_gemini_voice: e.target.value }))
                  }
                  className="w-full text-xs p-2.5 rounded-xl bg-stone-50 dark:bg-slate-900/60 border border-stone-200 dark:border-slate-700 text-stone-800 dark:text-stone-100 focus:outline-none focus:border-amber-500"
                >
                  {GEMINI_VOICES.map((v) => (
                    <option key={v.name} value={v.name}>
                      {v.name} ({v.gender === 'masculino' ? 'Voz Masculina' : 'Voz Feminina'}) — {v.tone}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1 flex items-center gap-1.5">
                  <Music className="w-3.5 h-3.5 text-indigo-600" />
                  Trilha Sonora Padrão
                </label>
                <select
                  value={settings.default_ambient_track}
                  onChange={(e) =>
                    setSettings((prev) => ({ ...prev, default_ambient_track: e.target.value }))
                  }
                  className="w-full text-xs p-2.5 rounded-xl bg-stone-50 dark:bg-slate-900/60 border border-stone-200 dark:border-slate-700 text-stone-800 dark:text-stone-100 focus:outline-none focus:border-amber-500"
                >
                  <option value="432hz">Frequência 432 Hz (Paz e Cura Interior)</option>
                  <option value="rain">Chuva Serena no Refúgio</option>
                </select>
              </div>
            </div>

            {/* NOME DO GUIA PADRÃO & MOTOR DE VOZ */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Nome do Mentor Padrão
                </label>
                <input
                  type="text"
                  value={settings.default_guide_name}
                  onChange={(e) =>
                    setSettings((prev) => ({ ...prev, default_guide_name: e.target.value }))
                  }
                  placeholder="Izaque"
                  className="w-full text-xs p-2.5 rounded-xl bg-stone-50 dark:bg-slate-900/60 border border-stone-200 dark:border-slate-700 text-stone-800 dark:text-stone-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1 flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-amber-600" />
                  Motor de Síntese
                </label>
                <select
                  value={settings.default_voice_engine}
                  onChange={(e) =>
                    setSettings((prev) => ({ ...prev, default_voice_engine: e.target.value }))
                  }
                  className="w-full text-xs p-2.5 rounded-xl bg-stone-50 dark:bg-slate-900/60 border border-stone-200 dark:border-slate-700 text-stone-800 dark:text-stone-100 focus:outline-none focus:border-amber-500"
                >
                  <option value="gemini">Google Gemini Neural (Recomendado)</option>
                  <option value="browser">Sintetizador Nativo do Navegador</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
