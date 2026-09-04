import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Volume2,
  VolumeX,
  Sparkles,
  Music,
  Wind,
  Headphones,
  Check,
  Feather,
  Sliders,
  Radio,
  SlidersHorizontal,
} from 'lucide-react';
import { ambientAudio } from '../services/ambientAudioService';

const GUIDE_NAME_SUGGESTIONS = ['Izaque', 'Guia', 'Mentor', 'Hermes', 'Sophia', 'Conselheiro'];

export default function UserSettingsModal({ isOpen, onClose, onGuideNameChanged }) {
  const [guideName, setGuideName] = useState(() => {
    return localStorage.getItem('izaque_guide_name') || 'Izaque';
  });

  const [ambientTrack, setAmbientTrack] = useState(() => {
    return localStorage.getItem('izaque_ambient_track') || '432hz';
  });

  const [ambientVolume, setAmbientVolume] = useState(() => {
    return parseFloat(localStorage.getItem('izaque_ambient_volume') || '0.20');
  });

  const [isAmbientEnabled, setIsAmbientEnabled] = useState(() => {
    return localStorage.getItem('izaque_ambient_enabled') === 'true';
  });

  const [immersiveVoice, setImmersiveVoice] = useState(() => {
    return localStorage.getItem('izaque_immersive_voice') === 'true';
  });

  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setGuideName(localStorage.getItem('izaque_guide_name') || 'Izaque');
      setAmbientTrack(localStorage.getItem('izaque_ambient_track') || '432hz');
      setAmbientVolume(parseFloat(localStorage.getItem('izaque_ambient_volume') || '0.20'));
      setIsAmbientEnabled(localStorage.getItem('izaque_ambient_enabled') === 'true');
      setImmersiveVoice(localStorage.getItem('izaque_immersive_voice') === 'true');
    }
  }, [isOpen]);

  const handleToggleAmbient = (enabled) => {
    setIsAmbientEnabled(enabled);
    localStorage.setItem('izaque_ambient_enabled', enabled ? 'true' : 'false');

    if (enabled) {
      ambientAudio.setVolume(ambientVolume);
      ambientAudio.setTrack(ambientTrack);
      ambientAudio.play();
    } else {
      ambientAudio.pause();
    }
  };

  const handleSelectTrack = (track) => {
    setAmbientTrack(track);
    localStorage.setItem('izaque_ambient_track', track);
    if (isAmbientEnabled) {
      ambientAudio.setTrack(track);
    }
  };

  const handleVolumeChange = (vol) => {
    const parsed = parseFloat(vol);
    setAmbientVolume(parsed);
    localStorage.setItem('izaque_ambient_volume', parsed.toString());
    ambientAudio.setVolume(parsed);
  };

  const handleToggleImmersive = (val) => {
    setImmersiveVoice(val);
    localStorage.setItem('izaque_immersive_voice', val ? 'true' : 'false');
  };

  const handleSaveAll = () => {
    const finalGuideName = guideName.trim() || 'Izaque';
    localStorage.setItem('izaque_guide_name', finalGuideName);
    if (onGuideNameChanged) onGuideNameChanged(finalGuideName);
    window.dispatchEvent(new Event('storage'));

    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 600);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-stone-900/60 backdrop-blur-md pt-safe pb-safe">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 14 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -14 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-lg bg-stone-50 dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-3xl sm:rounded-4xl p-5 sm:p-8 shadow-2xl text-stone-800 dark:text-stone-100 relative max-h-[88dvh] overflow-y-auto"
      >
        {/* CABEÇALHO */}
        <div className="flex items-center justify-between pb-4 border-b border-stone-200/80 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-700/10 dark:bg-teal-500/15 border border-teal-700/20 dark:border-teal-500/30 flex items-center justify-center text-teal-800 dark:text-teal-400">
              <SlidersHorizontal className="w-5 h-5 stroke-[1.75]" />
            </div>
            <div>
              <h3 className="text-base font-serif font-medium text-stone-900 dark:text-stone-50">
                Preferências do Santuário
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Personalize sua imersão, sons de cura e o tom do seu guia
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-200/50 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="py-6 space-y-7">
          {/* 1. NOME DO SEU GUIA */}
          <div className="space-y-3">
            <label className="block text-xs font-semibold uppercase tracking-wider text-teal-800 dark:text-teal-400">
              1. Nome do Seu Guia
            </label>
            <input
              type="text"
              value={guideName}
              onChange={(e) => setGuideName(e.target.value)}
              placeholder="Ex: Izaque, Mentor, Hermes..."
              className="w-full px-4 py-3 rounded-2xl bg-white dark:bg-slate-800 border border-stone-300 dark:border-slate-700 focus:border-teal-700 text-base sm:text-sm text-stone-800 dark:text-stone-100 outline-none transition"
            />
            <div className="flex flex-wrap gap-1.5 pt-1">
              {GUIDE_NAME_SUGGESTIONS.map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setGuideName(n)}
                  className={`text-xs px-3 py-1 rounded-xl border transition ${
                    guideName === n
                      ? 'bg-teal-700 text-white border-teal-700'
                      : 'bg-white/70 dark:bg-slate-800 text-stone-600 dark:text-stone-300 border-stone-200 dark:border-slate-700 hover:border-teal-600'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          {/* 2. MÚSICA DE FUNDO COM AUDIO DUCKING (O Toque de Milhões) */}
          <div className="space-y-4 pt-4 border-t border-stone-200/80 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-teal-800 dark:text-teal-400 block">
                  2. Trilha Sonora Relaxante
                </span>
                <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">
                  Música contínua com <em>Audio Ducking</em> (abaixa suavemente quando o guia fala)
                </p>
              </div>

              <button
                type="button"
                onClick={() => handleToggleAmbient(!isAmbientEnabled)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  isAmbientEnabled ? 'bg-teal-700' : 'bg-stone-300 dark:bg-slate-700'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                    isAmbientEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {isAmbientEnabled && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="space-y-3 pt-2"
              >
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => handleSelectTrack('432hz')}
                    className={`p-3 rounded-2xl border text-left transition flex items-center gap-2.5 ${
                      ambientTrack === '432hz'
                        ? 'bg-teal-50 dark:bg-teal-950/40 border-teal-700 text-teal-900 dark:text-teal-200'
                        : 'bg-white dark:bg-slate-800 border-stone-200 dark:border-slate-700 text-stone-700 dark:text-stone-300'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-xl bg-teal-700/10 flex items-center justify-center text-teal-800 dark:text-teal-400 shrink-0">
                      <Wind className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold">Frequência 432 Hz</div>
                      <div className="text-[10px] text-stone-400">Ondas Theta de cura</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSelectTrack('rain')}
                    className={`p-3 rounded-2xl border text-left transition flex items-center gap-2.5 ${
                      ambientTrack === 'rain'
                        ? 'bg-teal-50 dark:bg-teal-950/40 border-teal-700 text-teal-900 dark:text-teal-200'
                        : 'bg-white dark:bg-slate-800 border-stone-200 dark:border-slate-700 text-stone-700 dark:text-stone-300'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-xl bg-teal-700/10 flex items-center justify-center text-teal-800 dark:text-teal-400 shrink-0">
                      <Music className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold">Chuva Serena</div>
                      <div className="text-[10px] text-stone-400">Ruído de água suave</div>
                    </div>
                  </button>
                </div>

                <div className="pt-2">
                  <div className="flex items-center justify-between text-xs text-stone-500 mb-1">
                    <span>Volume do Som Ambiente</span>
                    <span className="font-mono">{Math.round(ambientVolume * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.05"
                    max="0.50"
                    step="0.02"
                    value={ambientVolume}
                    onChange={(e) => handleVolumeChange(e.target.value)}
                    className="w-full accent-teal-700 cursor-pointer"
                  />
                </div>
              </motion.div>
            )}
          </div>

          {/* 3. MODO IMERSIVO (VOZ AUTOMÁTICA) */}
          <div className="flex items-center justify-between pt-4 border-t border-stone-200/80 dark:border-slate-800">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-teal-800 dark:text-teal-400 block">
                3. Modo Imersivo (Ouvir Sempre)
              </span>
              <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">
                Toca a voz do guia automaticamente quando uma nova reflexão é recebida
              </p>
            </div>

            <button
              type="button"
              onClick={() => handleToggleImmersive(!immersiveVoice)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                immersiveVoice ? 'bg-teal-700' : 'bg-stone-300 dark:bg-slate-700'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                  immersiveVoice ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* BOTÃO SALVAR */}
        <div className="pt-4 border-t border-stone-200/80 dark:border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={handleSaveAll}
            className="w-full sm:w-auto px-7 py-3 rounded-2xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-medium tracking-wide shadow-md transition flex items-center justify-center gap-2"
          >
            {savedSuccess ? (
              <>
                <Check className="w-4 h-4" />
                <span>Preferências Salvas!</span>
              </>
            ) : (
              <span>Salvar Preferências</span>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
