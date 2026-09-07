import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Feather,
  Mic,
  MicOff,
  Send,
  Heart,
  Wind,
  Smile,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Sliders,
  Check,
  CheckCheck,
  Music,
  Headphones,
  Sparkles,
  Sun,
  Moon,
  Coffee,
  Loader2,
  ArrowLeft,
} from 'lucide-react';
import {
  sendChatMessage,
  sendAudioChatMessage,
  fetchActiveAgents,
  fetchVoiceAudio,
  fetchChatHistory,
  clearChatHistory,
  cleanTextForSpeech,
  updateUserProfile,
} from '../services/api';
import { ambientAudio } from '../services/ambientAudioService';
import { humanVoiceService } from '../services/voiceService';
import UserSettingsModal from './UserSettingsModal';

/**
 * Indicador de Reflexão Humanizado
 * Substitui o loading mecânico por um momento de escuta atenta e compassiva
 */
function ReflectingIndicator({ guideName = 'Izaque' }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="flex items-center gap-3.5 py-3 px-5 rounded-3xl bg-white/80 dark:bg-slate-800/80 border border-stone-200/80 dark:border-slate-700/60 max-w-sm my-2 shadow-sm"
    >
      <div className="w-8 h-8 rounded-full bg-teal-700/10 dark:bg-teal-500/15 flex items-center justify-center text-teal-800 dark:text-teal-400 shrink-0">
        <Wind className="w-4 h-4 animate-breathe" />
      </div>

      <div className="flex flex-col">
        <span className="text-xs sm:text-sm font-serif text-stone-700 dark:text-stone-200">
          {guideName} está refletindo com cuidado...
        </span>
        <div className="flex items-center gap-1.5 mt-1">
          <span className="w-1.5 h-1.5 rounded-full bg-teal-700/60 dark:bg-teal-400/60 animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-1.5 h-1.5 rounded-full bg-teal-700/60 dark:bg-teal-400/60 animate-bounce" style={{ animationDelay: '250ms' }} />
          <span className="w-1.5 h-1.5 rounded-full bg-teal-700/60 dark:bg-teal-400/60 animate-bounce" style={{ animationDelay: '500ms' }} />
        </div>
      </div>
    </motion.div>
  );
}

/**
 * Botão de Ouvir Reflexão com Breathing UI e Audio Ducking
 */
function VoiceReflectionButton({ text, messageId, isPlaying, isAudioLoading, onTogglePlay }) {
  return (
    <div className="mt-3 pt-3 border-t border-stone-100 dark:border-slate-700/40 flex items-center justify-between">
      <motion.button
        type="button"
        onClick={onTogglePlay}
        disabled={isAudioLoading}
        animate={
          isPlaying
            ? {
                scale: [1, 1.03, 1],
                boxShadow: [
                  '0 0 0px rgba(20, 184, 166, 0)',
                  '0 0 14px rgba(20, 184, 166, 0.35)',
                  '0 0 0px rgba(20, 184, 166, 0)',
                ],
              }
            : {}
        }
        transition={
          isPlaying
            ? {
                duration: 4,
                repeat: Infinity,
                ease: 'easeInOut',
              }
            : {}
        }
        className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition flex items-center gap-2 border ${
          isPlaying
            ? 'bg-teal-700 text-white border-teal-700 shadow-md'
            : 'bg-stone-100 dark:bg-slate-750 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-slate-700 hover:border-teal-600 hover:text-teal-800 dark:hover:text-teal-300'
        }`}
      >
        {isAudioLoading ? (
          <>
            <Loader2 className="w-3.5 h-3.5 animate-spin text-teal-600" />
            <span>Preparando voz calma...</span>
          </>
        ) : isPlaying ? (
          <>
            <Pause className="w-3.5 h-3.5 fill-current" />
            <span>Pausar Voz</span>
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
          </>
        ) : (
          <>
            <Volume2 className="w-3.5 h-3.5" />
            <span>Ouvir Reflexão</span>
          </>
        )}
      </motion.button>

      {isPlaying && (
        <span className="text-[10px] text-teal-700 dark:text-teal-400 font-serif italic flex items-center gap-1">
          <Sparkles className="w-3 h-3" />
          Voz Humanizada Ativa
        </span>
      )}
    </div>
  );
}

export default function ReflectionSpace({ user, onEditGuideName, onBackToHome }) {
  const [guideName, setGuideName] = useState(() => {
    return localStorage.getItem('izaque_guide_name') || 'Izaque';
  });

  const [reflections, setReflections] = useState([
    {
      id: 'initial',
      role: 'guide',
      content: `Olá... Respire fundo e sinta-se em paz. Este é o seu refúgio pessoal, livre de cobranças ou julgamentos do mundo lá fora.\n\nO que tem pesado na sua mente ou no seu coração ultimamente?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      memoriesRecalled: 0,
      knowledgeApplied: 0,
    },
  ]);

  const [inputVal, setInputVal] = useState('');
  const [isReflecting, setIsReflecting] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);

  // Agentes Especialistas e Perguntas Prontas de Condução
  const [activeAgents, setActiveAgents] = useState([]);
  const [selectedAgentId, setSelectedAgentId] = useState('auto');

  useEffect(() => {
    fetchActiveAgents().then((list) => {
      if (Array.isArray(list) && list.length > 0) {
        setActiveAgents(list);
      }
    });
  }, []);

  const activeAgent = selectedAgentId === 'auto'
    ? null
    : activeAgents.find((a) => a.id === selectedAgentId || a.slug === selectedAgentId);

  const currentStarterQuestions = React.useMemo(() => {
    if (activeAgent) {
      return Array.isArray(activeAgent.starter_questions) ? activeAgent.starter_questions : [];
    }
    const combined = [];
    (activeAgents || []).forEach((ag) => {
      if (Array.isArray(ag.starter_questions)) {
        ag.starter_questions.slice(0, 2).forEach((q) => {
          combined.push({
            ...q,
            agentName: ag.name,
            agentId: ag.id,
          });
        });
      }
    });
    return combined;
  }, [activeAgent, activeAgents]);

  const handleSelectStarterQuestion = (questionText) => {
    if (!questionText || isReflecting) return;
    setInputVal('');
    handleSendReflection(null, questionText);
  };

  // Estado e Controle Rápido do Som Ambiente Terapêutico
  const [isAmbientActive, setIsAmbientActive] = useState(() => {
    return localStorage.getItem('izaque_ambient_enabled') === 'true';
  });
  const [ambientTrack, setAmbientTrack] = useState(() => {
    return localStorage.getItem('izaque_ambient_track') || '432hz';
  });

  // Sincroniza em tempo real se o som ambiente for alterado no modal ou em outra aba
  useEffect(() => {
    const syncAmbient = () => {
      const enabled = localStorage.getItem('izaque_ambient_enabled') === 'true';
      setIsAmbientActive(enabled);
      setAmbientTrack(localStorage.getItem('izaque_ambient_track') || '432hz');
    };
    window.addEventListener('storage', syncAmbient);
    return () => window.removeEventListener('storage', syncAmbient);
  }, []);

  const handleToggleAmbientQuick = () => {
    const nextState = !isAmbientActive;
    setIsAmbientActive(nextState);
    localStorage.setItem('izaque_ambient_enabled', nextState ? 'true' : 'false');

    if (nextState) {
      const vol = parseFloat(localStorage.getItem('izaque_ambient_volume') || '0.20');
      const track = localStorage.getItem('izaque_ambient_track') || '432hz';
      ambientAudio.setVolume(vol);
      ambientAudio.setTrack(track);
      ambientAudio.play();
    } else {
      ambientAudio.pause();
    }

    // Sincroniza também no Supabase se o usuário estiver logado
    if (user?.id) {
      updateUserProfile(user.id, {
        preferences: {
          ambient_enabled: nextState,
        },
      }).catch(() => {});
    }

    window.dispatchEvent(new Event('storage'));
  };

  // Carregar histórico persistente do banco de dados (Supabase izaque_messages)
  useEffect(() => {
    if (!user?.id) {
      setLoadingHistory(false);
      return;
    }

    let isMounted = true;
    const loadPersistedHistory = async () => {
      try {
        setLoadingHistory(true);
        const historyData = await fetchChatHistory(user.id);
        if (isMounted && historyData && historyData.length > 0) {
          setReflections(historyData);
        }
      } catch (err) {
        console.warn('Histórico persistido indisponível no momento:', err?.message);
      } finally {
        if (isMounted) {
          setLoadingHistory(false);
        }
      }
    };

    loadPersistedHistory();

    return () => {
      isMounted = false;
    };
  }, [user?.id]);

  // Estado de Reprodução de Voz do Guia
  const [activeVoiceMessageId, setActiveVoiceMessageId] = useState(null);
  const [loadingVoiceId, setLoadingVoiceId] = useState(null);
  const audioElementRef = useRef(null);

  // Estado de Reprodução do Áudio Enviado pelo Usuário
  const [activeUserAudioId, setActiveUserAudioId] = useState(null);
  const userAudioPlayerRef = useRef(null);

  // Estado de Gravação de Áudio (Voz do Usuário)
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerIntervalRef = useRef(null);
  const endRef = useRef(null);

  // Saudação contextual
  const getGreeting = () => {
    const hour = new Date().getHours();
    const name = user?.name || user?.email?.split('@')[0] || 'Viajante';

    if (hour >= 5 && hour < 12) {
      return {
        icon: <Sun className="w-4 h-4 text-amber-600" />,
        text: `Bom dia, ${name}. Respire com calma. Que este dia comece com leveza e sem pressa.`,
      };
    } else if (hour >= 12 && hour < 18) {
      return {
        icon: <Coffee className="w-4 h-4 text-amber-700" />,
        text: `Boa tarde, ${name}. Pause um instante. Como está o peso nos seus ombros agora?`,
      };
    } else {
      return {
        icon: <Moon className="w-4 h-4 text-teal-600" />,
        text: `Boa noite, ${name}. Respire fundo. Este espaço é seguro e é seu. Deixe aqui o que pesou hoje.`,
      };
    }
  };

  const greeting = getGreeting();

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [reflections, isReflecting]);

  // Limpeza de áudio ao desmontar (HTML5 Audio e Web Speech API)
  useEffect(() => {
    return () => {
      if (audioElementRef.current) audioElementRef.current.pause();
      if (userAudioPlayerRef.current) userAudioPlayerRef.current.pause();
      humanVoiceService.stop();
      ambientAudio.restoreAfterSpeech(0.5);
    };
  }, []);

  // Reprodução de voz via motor humanizado (Web Speech API Neural com frases e respiração)
  const playNativeSpeech = (rawText, messageId) => {
    try {
      if (!humanVoiceService.isSupported()) {
        console.warn('Navegador não possui suporte à síntese de voz nativa.');
        setLoadingVoiceId(null);
        setActiveVoiceMessageId(null);
        ambientAudio.restoreAfterSpeech(0.5);
        return;
      }

      humanVoiceService.stop();

      humanVoiceService.speak(rawText, {
        onStart: () => {
          setActiveVoiceMessageId(messageId);
          setLoadingVoiceId(null);
          ambientAudio.duckForSpeech(0.04, 0.8);
        },
        onEnd: () => {
          setActiveVoiceMessageId(null);
          ambientAudio.restoreAfterSpeech(1.5);
        },
        onError: () => {
          setActiveVoiceMessageId(null);
          setLoadingVoiceId(null);
          ambientAudio.restoreAfterSpeech(0.5);
        },
      });
    } catch (synthErr) {
      console.error('Erro ao executar voz humanizada:', synthErr);
      setLoadingVoiceId(null);
      setActiveVoiceMessageId(null);
      ambientAudio.restoreAfterSpeech(0.5);
    }
  };

  // Tocar ou Pausar Voz do Mentor (Prioriza Voz Neural Humanizada com Ajustes do Usuário)
  const handleToggleVoicePlay = async (messageId, text) => {
    // Se já estiver tocando essa mensagem, pausa
    if (activeVoiceMessageId === messageId) {
      if (audioElementRef.current && !audioElementRef.current.paused) {
        audioElementRef.current.pause();
      }
      humanVoiceService.stop();
      setActiveVoiceMessageId(null);
      ambientAudio.restoreAfterSpeech(1.2);
      return;
    }

    // Cancela áudios do usuário e qualquer fala ativa
    if (audioElementRef.current) audioElementRef.current.pause();
    if (userAudioPlayerRef.current) userAudioPlayerRef.current.pause();
    setActiveUserAudioId(null);
    humanVoiceService.stop();

    // 1. Verifica a preferência de tecnologia de voz (Gemini Nativo vs Navegador Local)
    const voiceEngine = localStorage.getItem('izaque_voice_engine') || 'gemini';
    const preferBrowser = voiceEngine === 'browser' || localStorage.getItem('izaque_voice_prefer_browser') === 'true';

    if (preferBrowser) {
      playNativeSpeech(text, messageId);
      return;
    }

    // 2. Modo Nativo Gemini: Voz Neural de Alta Fidelidade (Charon / Aoede / Kore)
    const geminiVoice = localStorage.getItem('izaque_gemini_voice') || 'Charon';

    if (!audioElementRef.current) {
      audioElementRef.current = new Audio();
    }
    const audio = audioElementRef.current;
    audio.pause();
    ambientAudio.initContext();

    try {
      setLoadingVoiceId(messageId);
      const voiceRes = await fetchVoiceAudio({ text, messageId, voiceName: geminiVoice });

      if (voiceRes?.audioUrl && !voiceRes.useSpeechSynthesis) {
        audio.src = voiceRes.audioUrl;
        audio.currentTime = 0;

        audio.onplay = () => {
          setActiveVoiceMessageId(messageId);
          setLoadingVoiceId(null);
          ambientAudio.duckForSpeech(0.04, 0.8);
        };

        audio.onended = () => {
          setActiveVoiceMessageId(null);
          ambientAudio.restoreAfterSpeech(1.5);
        };

        audio.onerror = () => {
          console.warn('⚠️ Erro ao reproduzir áudio Gemini, acionando sintetizador local...');
          playNativeSpeech(voiceRes.cleanedText || text, messageId);
        };

        const playPromise = audio.play();
        if (playPromise !== undefined) {
          await playPromise;
        }
        return;
      }

      playNativeSpeech(voiceRes?.cleanedText || text, messageId);
    } catch (err) {
      console.warn('⚠️ Tentando fallback de voz local devido a:', err?.message);
      playNativeSpeech(text, messageId);
    }
  };

  // Tocar ou Pausar Áudio Gravado e Enviado pelo Usuário
  const handleToggleUserAudioPlay = (item) => {
    if (activeUserAudioId === item.id) {
      if (userAudioPlayerRef.current) userAudioPlayerRef.current.pause();
      setActiveUserAudioId(null);
      ambientAudio.restoreAfterSpeech(1.0);
      return;
    }

    if (audioElementRef.current) audioElementRef.current.pause();
    setActiveVoiceMessageId(null);
    humanVoiceService.stop();

    if (!userAudioPlayerRef.current) {
      userAudioPlayerRef.current = new Audio();
    }
    const player = userAudioPlayerRef.current;

    // Se possui áudio original gravado na sessão
    if (item.audioUrl) {
      player.src = item.audioUrl;
      player.currentTime = 0;

      player.onplay = () => {
        setActiveUserAudioId(item.id);
        ambientAudio.duckForSpeech(0.04, 0.6);
      };

      player.onended = () => {
        setActiveUserAudioId(null);
        ambientAudio.restoreAfterSpeech(1.2);
      };

      player.onerror = () => {
        playUserAudioFallback(item);
      };

      player.play().catch(() => {
        playUserAudioFallback(item);
      });
      return;
    }

    // Se for mensagem antiga do histórico sem blob salvo, reproduz a transcrição
    playUserAudioFallback(item);
  };

  const playUserAudioFallback = (item) => {
    setActiveUserAudioId(item.id);
    ambientAudio.duckForSpeech(0.04, 0.6);
    humanVoiceService.speak(item.content, {
      customSettings: {
        rate: 1.0,
        pitch: 1.0,
        gender: 'auto',
      },
      onStart: () => setActiveUserAudioId(item.id),
      onEnd: () => {
        setActiveUserAudioId(null);
        ambientAudio.restoreAfterSpeech(1.2);
      },
      onError: () => {
        setActiveUserAudioId(null);
        ambientAudio.restoreAfterSpeech(0.5);
      },
    });
  };

  // Enviar Reflexão Escrita
  const handleSendReflection = async (e, directText = null) => {
    e?.preventDefault();
    const text = (directText !== null ? directText : inputVal).trim();
    if (!text || isReflecting) return;

    const userEntry = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setReflections((prev) => [...prev, userEntry]);
    if (directText === null) setInputVal('');
    setIsReflecting(true);

    try {
      const history = reflections
        .filter((r) => r.id !== 'initial')
        .map((r) => ({
          role: r.role === 'guide' ? 'assistant' : 'user',
          content: r.content,
        }));

      const res = await sendChatMessage({
        message: text,
        userId: user?.id || 'default_user_guest',
        agentId: selectedAgentId,
        history,
      });

      const guideEntry = {
        id: (Date.now() + 1).toString(),
        role: 'guide',
        content: res.reply,
        agentUsed: res.agentUsed || null,
        memoriesRecalled: res.memoriesUsed?.length || 0,
        knowledgeApplied: res.knowledgeUsed?.length || 0,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setReflections((prev) => [...prev, guideEntry]);

      // MODO IMERSIVO: Se ativado, toca automaticamente
      const isImmersive = localStorage.getItem('izaque_immersive_voice') === 'true';
      if (isImmersive) {
        setTimeout(() => {
          handleToggleVoicePlay(guideEntry.id, guideEntry.content);
        }, 500);
      }
    } catch (err) {
      setReflections((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'guide',
          content: 'Houve uma breve pausa na conexão da mentoria. Mas estou aqui ouvindo você. Gostaria de reenviar?',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsReflecting(false);
    }
  };

  const startAudioRecording = async () => {
    try {
      if (!navigator?.mediaDevices?.getUserMedia) {
        alert('O microfone no celular requer conexão segura (HTTPS ou localhost). Se estiver testando na rede local, ative HTTPS ou acesse via localhost.');
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];

      // Detecção inteligente de MIME types compatíveis (Crucial para iPhone / Safari)
      let selectedMime = 'audio/webm';
      let recorderOptions = {};

      if (typeof MediaRecorder.isTypeSupported === 'function') {
        if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
          selectedMime = 'audio/webm;codecs=opus';
          recorderOptions = { mimeType: selectedMime };
        } else if (MediaRecorder.isTypeSupported('audio/webm')) {
          selectedMime = 'audio/webm';
          recorderOptions = { mimeType: selectedMime };
        } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
          // Padrão nativo do iPhone / Safari no iOS
          selectedMime = 'audio/mp4';
          recorderOptions = { mimeType: selectedMime };
        } else if (MediaRecorder.isTypeSupported('audio/aac')) {
          selectedMime = 'audio/aac';
          recorderOptions = { mimeType: selectedMime };
        }
      }

      let recorder;
      try {
        recorder = new MediaRecorder(stream, recorderOptions);
      } catch (e) {
        recorder = new MediaRecorder(stream);
      }

      mediaRecorderRef.current = recorder;
      const actualMime = recorder.mimeType || selectedMime || 'audio/webm';

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: actualMime });
        stream.getTracks().forEach((track) => track.stop());

        // Converte para Base64 e processa
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const dataUrl = reader.result;
          const base64Data = typeof dataUrl === 'string' ? dataUrl.split(',')[1] : '';
          await processVoiceReflection(base64Data, recordingDuration, actualMime, dataUrl);
        };
      };

      recorder.start();
      setIsRecording(true);
      setRecordingDuration(0);

      timerIntervalRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      alert('Não foi possível acessar o microfone para o áudio de reflexão. Verifique as permissões do navegador.');
    }
  };

  const stopAudioRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(timerIntervalRef.current);
    }
  };

  const cancelAudioRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(timerIntervalRef.current);
      audioChunksRef.current = [];
    }
  };

  const processVoiceReflection = async (audioBase64, durationSeconds, mimeType = 'audio/webm', dataUrl = null) => {
    setIsReflecting(true);

    try {
      const history = reflections
        .filter((r) => r.id !== 'initial')
        .map((r) => ({
          role: r.role === 'guide' ? 'assistant' : 'user',
          content: r.content,
        }));

      const res = await sendAudioChatMessage({
        audioBase64,
        mimeType,
        userId: user?.id || 'default_user_guest',
        agentId: selectedAgentId,
        durationSeconds,
        history,
      });

      // Mensagem transcrita do usuário (Estilo WhatsApp)
      const userAudioEntry = {
        id: Date.now().toString(),
        role: 'user',
        content: res.transcription || 'Reflexão em áudio gravada.',
        isVoice: true,
        audioUrl: dataUrl,
        durationSeconds,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      // Resposta do guia
      const guideAudioEntry = {
        id: (Date.now() + 1).toString(),
        role: 'guide',
        content: res.reply,
        agentUsed: res.agentUsed || null,
        memoriesRecalled: res.memoriesUsed?.length || 0,
        knowledgeApplied: res.knowledgeUsed?.length || 0,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setReflections((prev) => [...prev, userAudioEntry, guideAudioEntry]);

      // MODO IMERSIVO: Se ativado, toca a resposta do guia automaticamente
      const isImmersive = localStorage.getItem('izaque_immersive_voice') === 'true';
      if (isImmersive) {
        setTimeout(() => {
          handleToggleVoicePlay(guideAudioEntry.id, guideAudioEntry.content);
        }, 600);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsReflecting(false);
    }
  };

  return (
    <div className="flex flex-col h-full flex-1 w-full max-w-4xl mx-auto bg-stone-50 dark:bg-slate-900 sm:border-x border-stone-200/80 dark:border-slate-800 transition-colors duration-300 font-sans text-stone-800 dark:text-stone-100 overflow-hidden">
      {/* MODAL DE CONFIGURAÇÕES DE USUÁRIO */}
      <UserSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        user={user}
        onGuideNameChanged={(name) => setGuideName(name)}
      />

      {/* HEADER DA SESSÃO */}
      <header className="px-3 sm:px-6 py-2 sm:py-3.5 pt-safe border-b border-stone-200/80 dark:border-slate-800 bg-stone-50/90 dark:bg-slate-900/90 backdrop-blur-md sticky top-0 z-20 flex items-center justify-between shrink-0 gap-2">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          {onBackToHome && (
            <button
              type="button"
              onClick={onBackToHome}
              title="Voltar para o Início"
              className="md:hidden p-2 text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 rounded-xl hover:bg-stone-200/50 dark:hover:bg-slate-800 transition min-w-[40px] min-h-[40px] flex items-center justify-center shrink-0 active:scale-95"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-2xl bg-teal-700/10 dark:bg-teal-500/15 border border-teal-700/20 dark:border-teal-500/30 flex items-center justify-center text-teal-800 dark:text-teal-400 shrink-0">
            <Feather className="w-4 h-4 sm:w-5 sm:h-5 stroke-[1.75]" />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm sm:text-base font-serif font-medium text-stone-900 dark:text-stone-50 leading-tight truncate">
              Sessão com {guideName}
            </h2>
            <p className="text-[10px] sm:text-[11px] text-stone-500 dark:text-stone-400 flex items-center gap-1.5 mt-0.5 truncate">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-600 dark:bg-teal-400 shrink-0" />
              Mentoria ativa • Escuta atenta
            </p>
          </div>
        </div>

        {/* BOTÕES DE CONTROLE: SOM AMBIENTE RÁPIDO & PREFERÊNCIAS */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* ATIVAÇÃO OU DESATIVAÇÃO RÁPIDA DO SOM AMBIENTE */}
          <button
            type="button"
            onClick={handleToggleAmbientQuick}
            title={
              isAmbientActive
                ? `Som Ambiente Ativo (${ambientTrack === 'rain' ? 'Chuva' : '432 Hz'}). Clique para pausar.`
                : 'Ativar Som Ambiente Terapêutico (Frequência 432 Hz / Chuva)'
            }
            className={`px-2.5 sm:px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-200 flex items-center gap-1.5 border shadow-sm active:scale-95 min-h-[36px] ${
              isAmbientActive
                ? 'bg-teal-50 dark:bg-teal-950/70 text-teal-800 dark:text-teal-300 border-teal-400 dark:border-teal-700 shadow-teal-700/10'
                : 'bg-white dark:bg-slate-800 text-stone-500 dark:text-stone-400 border-stone-200 dark:border-slate-700 hover:text-stone-800 dark:hover:text-stone-200 hover:border-stone-300'
            }`}
          >
            {isAmbientActive ? (
              <>
                <Volume2 className="w-3.5 h-3.5 text-teal-700 dark:text-teal-400 shrink-0 animate-pulse" />
                <span className="text-[11px] font-medium hidden xs:inline sm:inline">
                  {ambientTrack === 'rain' ? 'Chuva' : '432 Hz'}
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-teal-500 dark:bg-teal-400 animate-ping shrink-0" />
              </>
            ) : (
              <>
                <VolumeX className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                <span className="text-[11px] text-stone-500 dark:text-stone-400 hidden xs:inline sm:inline">
                  Som Ambiente
                </span>
              </>
            )}
          </button>

          {/* BOTÃO DE PREFERÊNCIAS COMPLETAS */}
          <button
            type="button"
            onClick={() => setIsSettingsOpen(true)}
            title="Ajustes de voz, nome e som ambiente"
            className="p-2 sm:px-3 sm:py-1.5 rounded-full bg-white dark:bg-slate-800 hover:bg-stone-100 dark:hover:bg-slate-700 text-stone-600 dark:text-stone-300 text-xs font-medium transition flex items-center gap-1.5 border border-stone-200 dark:border-slate-700 shadow-sm active:scale-95 min-h-[36px] min-w-[36px] justify-center"
          >
            <Sliders className="w-3.5 h-3.5 text-teal-700 dark:text-teal-400" />
            <span className="hidden sm:inline">Ajustes</span>
          </button>
        </div>
      </header>

      {/* SAUDAÇÃO CONTEXTUAL */}
      <div className="px-4 sm:px-6 py-2 bg-stone-100/70 dark:bg-slate-800/40 border-b border-stone-200/60 dark:border-slate-800/60 text-xs text-stone-600 dark:text-stone-300 flex items-center gap-2 shrink-0">
        {greeting.icon}
        <span className="truncate">{greeting.text}</span>
      </div>

      {/* ÁREA DE MENSAGENS (LAYOUT ESTILO WHATSAPP ELEGANTE & TERAPÊUTICO) */}
      <main className="flex-1 overflow-y-auto overscroll-contain px-3 sm:px-6 py-4 sm:py-6 space-y-4">
        {loadingHistory && (
          <div className="text-center py-4 text-xs text-stone-500 font-serif flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-teal-700" />
            <span>Resgatando conversas e áudios anteriores...</span>
          </div>
        )}

        {reflections.map((item) => {
          const isUser = item.role === 'user';
          const isVoicePlaying = activeVoiceMessageId === item.id;
          const isVoiceLoading = loadingVoiceId === item.id;

          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[92%] sm:max-w-xl p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl transition-all shadow-sm ${
                  isUser
                    ? 'bg-teal-700 text-white rounded-tr-sm'
                    : 'bg-white dark:bg-slate-800 text-stone-800 dark:text-stone-100 border border-stone-200/80 dark:border-slate-700/70 rounded-tl-sm'
                }`}
              >
                {/* Cabeçalho do Balão */}
                <div
                  className={`flex items-center justify-between pb-1.5 mb-1.5 border-b text-[11px] ${
                    isUser
                      ? 'border-teal-600/60 text-teal-100'
                      : 'border-stone-100 dark:border-slate-700/50 text-stone-400 dark:text-stone-400'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-serif font-medium">{isUser ? 'Você' : guideName}</span>
                    {!isUser && item.agentUsed?.name && item.agentUsed.slug !== 'izaque-master' && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 border border-teal-200/60 dark:border-teal-800/40 font-serif flex items-center gap-1">
                        {item.agentUsed.slug === 'pastor-joao-biblico' ? '📖 ' : item.agentUsed.slug === 'mentor-financeiro' ? '💰 ' : item.agentUsed.slug === 'mentora-lideranca' ? '👥 ' : '🌿 '}
                        {item.agentUsed.name.split(' - ')[0]}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span>{item.timestamp}</span>
                    {isUser && <CheckCheck className="w-3.5 h-3.5 text-teal-200" />}
                  </div>
                </div>

                {/* Badges de Conexão: Memória Relembrada e Escrituras Bíblicas */}
                {!isUser && (
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {item.memoriesRecalled > 0 && (
                      <span className="text-[10px] font-medium text-teal-800 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/40 border border-teal-200/60 dark:border-teal-800/40 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                        🌿 Relembrando conversas passadas
                      </span>
                    )}
                    {item.agentUsed?.slug === 'pastor-joao-biblico' && (
                      <span className="text-[10px] font-medium text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-800/40 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                        📖 Fundamentado na Palavra de Deus (JFA)
                      </span>
                    )}
                  </div>
                )}

                {/* Áudio enviado pelo usuário com Player Interativo */}
                {item.isVoice && (
                  <div className="mb-2.5 p-2.5 sm:p-3 rounded-2xl bg-teal-800/60 border border-teal-600/50 flex items-center gap-3 text-xs shadow-sm">
                    <button
                      type="button"
                      onClick={() => handleToggleUserAudioPlay(item)}
                      title={activeUserAudioId === item.id ? 'Pausar áudio enviado' : 'Ouvir o áudio que você enviou'}
                      className="w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center shrink-0 transition transform active:scale-95 shadow-sm cursor-pointer"
                    >
                      {activeUserAudioId === item.id ? (
                        <Pause className="w-4 h-4 fill-current" />
                      ) : (
                        <Play className="w-4 h-4 fill-current ml-0.5" />
                      )}
                    </button>
                    <div className="flex-1">
                      <div className="flex items-center gap-1 h-4">
                        {[40, 75, 55, 90, 65, 45, 85, 60, 95, 50, 70, 40].map((h, i) => (
                          <span
                            key={i}
                            className={`w-1 rounded-full bg-white transition-all duration-300 ${
                              activeUserAudioId === item.id ? 'animate-pulse' : 'opacity-75'
                            }`}
                            style={{
                              height: `${h}%`,
                              animationDelay: `${i * 80}ms`,
                            }}
                          />
                        ))}
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-teal-100 font-mono mt-1">
                        <span>{activeUserAudioId === item.id ? 'Reproduzindo seu áudio...' : 'Áudio gravado por você'}</span>
                        <span>{item.durationSeconds ? `${item.durationSeconds}s` : ''}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Conteúdo textual da mensagem (Transcreve a fala com perfeição) */}
                <p className="text-sm sm:text-[15px] font-serif leading-relaxed whitespace-pre-wrap">
                  {item.content}
                </p>

                {/* Botão para Ouvir a Reflexão do Guia com Voz Humanizada */}
                {!isUser && (
                  <VoiceReflectionButton
                    text={item.content}
                    messageId={item.id}
                    isPlaying={isVoicePlaying}
                    isAudioLoading={isVoiceLoading}
                    onTogglePlay={() => handleToggleVoicePlay(item.id, item.content)}
                  />
                )}
              </div>
            </motion.div>
          );
        })}

        <AnimatePresence>
          {isReflecting && <ReflectingIndicator guideName={guideName} />}
        </AnimatePresence>

        <div ref={endRef} />
      </main>

      {/* FOOTER DE ENTRADA RESPONSIVO */}
      <footer className="p-2 sm:p-3.5 pb-safe border-t border-stone-200/80 dark:border-slate-800 bg-stone-50/95 dark:bg-slate-900/95 backdrop-blur-md shrink-0">
        {/* PERGUNTAS PRONTAS DE CONDUÇÃO DO MENTOR */}
        {!isRecording && currentStarterQuestions.length > 0 && (
          <div className="mb-2 px-1">
            <div className="flex items-center justify-between mb-1.5 px-0.5">
              <span className="text-[11px] font-serif text-stone-500 dark:text-stone-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0" />
                <span className="font-medium">
                  {activeAgent ? `Perguntas sugeridas por ${activeAgent.name}` : 'Perguntas sugeridas para conduzir sua reflexão'}:
                </span>
              </span>
            </div>
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none no-scrollbar">
              {currentStarterQuestions.map((q) => (
                <button
                  key={q.id || q.text}
                  type="button"
                  onClick={() => handleSelectStarterQuestion(q.text)}
                  disabled={isReflecting}
                  title={`Conduzir: "${q.text}"`}
                  className="shrink-0 text-left px-3 py-1.5 rounded-2xl bg-white dark:bg-slate-800 hover:bg-teal-50 dark:hover:bg-teal-950/60 text-stone-700 dark:text-stone-200 border border-stone-200/90 dark:border-slate-700 hover:border-teal-400 dark:hover:border-teal-600 text-xs font-serif transition-all shadow-2xs hover:shadow-xs active:scale-95 flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  {q.category && (
                    <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-teal-50 dark:bg-teal-900/60 text-teal-800 dark:text-teal-300 font-semibold border border-teal-200/60 dark:border-teal-800/40 shrink-0">
                      {q.category}
                    </span>
                  )}
                  <span className="truncate max-w-[240px] sm:max-w-md">{q.text}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {isRecording ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-2.5 sm:p-3.5 rounded-2xl sm:rounded-3xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 flex flex-col sm:flex-row items-center justify-between gap-2.5 sm:gap-4"
          >
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <span className="w-3 h-3 rounded-full bg-rose-500 animate-ping shrink-0" />
              <div>
                <span className="text-xs font-semibold text-stone-800 dark:text-stone-100 block">
                  Gravando seu desabafo...
                </span>
                <p className="text-[11px] text-stone-500 dark:text-stone-400 font-mono">
                  {Math.floor(recordingDuration / 60)}:
                  {String(recordingDuration % 60).padStart(2, '0')} min
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={cancelAudioRecording}
                className="px-3 py-2 rounded-xl text-xs text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 transition min-h-[40px] active:scale-95"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={stopAudioRecording}
                className="px-4 py-2 rounded-2xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-medium flex items-center gap-1.5 shadow-sm transition min-h-[40px] active:scale-95"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Enviar Áudio</span>
              </button>
            </div>
          </motion.div>
        ) : (
          <form onSubmit={handleSendReflection} className="relative flex items-center gap-2">
            <textarea
              rows={2}
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendReflection();
                }
              }}
              placeholder="O que está pesando na mente ou coração? Desabafe aqui..."
              disabled={isReflecting}
              className="w-full resize-none px-3.5 sm:px-5 py-2.5 sm:py-3 rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-800 border border-stone-300 dark:border-slate-700 focus:border-teal-700 dark:focus:border-teal-400 focus:ring-1 focus:ring-teal-700 text-base sm:text-sm text-stone-800 dark:text-stone-100 placeholder-stone-400 outline-none leading-relaxed transition pr-22 sm:pr-26 shadow-sm"
            />

            <div className="absolute right-2 sm:right-3 flex items-center gap-1">
              <button
                type="button"
                onClick={startAudioRecording}
                disabled={isReflecting}
                title="Gravar desabafo em áudio (com transcrição automática)"
                className="p-2 sm:p-2.5 rounded-full text-stone-500 hover:text-teal-800 dark:hover:text-teal-400 hover:bg-stone-100 dark:hover:bg-slate-700 transition min-w-[38px] min-h-[38px] sm:min-w-[42px] sm:min-h-[42px] flex items-center justify-center active:scale-95"
              >
                <Mic className="w-4 h-4" />
              </button>

              <button
                type="submit"
                disabled={isReflecting || !inputVal.trim()}
                title="Enviar desabafo"
                className="p-2 sm:p-2.5 rounded-full bg-teal-700 hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500 text-white shadow-md shadow-teal-700/20 disabled:opacity-40 transition flex items-center justify-center min-w-[38px] min-h-[38px] sm:min-w-[42px] sm:min-h-[42px] active:scale-95"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}

        <div className="mt-1 text-center hidden sm:block">
          <span className="text-[10px] text-stone-400 dark:text-stone-500">
            Pressione Enter para enviar • Áudio transcrito automaticamente • Total sigilo
          </span>
        </div>
      </footer>
    </div>
  );
}
