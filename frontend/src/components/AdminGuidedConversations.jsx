import React, { useState, useEffect } from 'react';
import {
  Compass,
  Plus,
  Trash2,
  Edit3,
  CheckCircle,
  AlertCircle,
  Save,
  RefreshCw,
  Search,
  MessageSquare,
  HelpCircle,
  Eye,
  EyeOff,
  Zap,
  Shield,
  TrendingUp,
  Heart,
  BookOpen,
  Target,
  Sparkles,
  ArrowUp,
  ArrowDown,
  X,
  Loader2,
} from 'lucide-react';
import {
  fetchAdminGuidedConversations,
  createAdminGuidedConversation,
  updateAdminGuidedConversation,
  deleteAdminGuidedConversation,
} from '../services/adminApi';

const ICON_OPTIONS = [
  { label: 'Bússola / Direção', value: 'Compass', icon: Compass },
  { label: 'Foco / Energia', value: 'Zap', icon: Zap },
  { label: 'Proteção / Sobriedade', value: 'Shield', icon: Shield },
  { label: 'Finanças / Crescimento', value: 'TrendingUp', icon: TrendingUp },
  { label: 'Coração / Acolhimento', value: 'Heart', icon: Heart },
  { label: 'Sabedoria / Bíblia', value: 'BookOpen', icon: BookOpen },
  { label: 'Meta / Alvo', value: 'Target', icon: Target },
  { label: 'Inspiração / Transformação', value: 'Sparkles', icon: Sparkles },
];

export default function AdminGuidedConversations({ agents = [] }) {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [feedbackMsg, setFeedbackMsg] = useState('');

  // Estado do formulário de criação/edição
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Foco & Disciplina',
    icon: 'Compass',
    agent_slug: 'izaque-master',
    questions: [],
    is_active: true,
    order_index: 0,
  });

  // Estado para adicionar nova pergunta ao roteiro
  const [newQuestionText, setNewQuestionText] = useState('');
  const [editingQuestionId, setEditingQuestionId] = useState(null);
  const [editingQuestionText, setEditingQuestionText] = useState('');
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    try {
      setRefreshing(true);
      const data = await fetchAdminGuidedConversations();
      setConversations(data || []);
    } catch (err) {
      console.error('Erro ao carregar conversas direcionadas:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const showToast = (msg) => {
    setFeedbackMsg(msg);
    setTimeout(() => setFeedbackMsg(''), 3500);
  };

  const handleOpenCreate = () => {
    setEditingId(null);
    setFormData({
      title: '',
      description: '',
      category: 'Foco & Disciplina',
      icon: 'Compass',
      agent_slug: agents[0]?.slug || 'izaque-master',
      questions: [],
      is_active: true,
      order_index: conversations.length + 1,
    });
    setNewQuestionText('');
    setIsEditing(true);
  };

  const handleOpenEdit = (conv) => {
    setEditingId(conv.id);
    setFormData({
      title: conv.title || '',
      description: conv.description || '',
      category: conv.category || 'Geral',
      icon: conv.icon || 'Compass',
      agent_slug: conv.agent_slug || 'izaque-master',
      questions: Array.isArray(conv.questions) ? [...conv.questions] : [],
      is_active: conv.is_active !== undefined ? conv.is_active : true,
      order_index: conv.order_index || 0,
    });
    setNewQuestionText('');
    setIsEditing(true);
  };

  const handleCloseForm = () => {
    setIsEditing(false);
    setEditingId(null);
  };

  // Perguntas do Roteiro
  const handleAddQuestion = (e) => {
    e?.preventDefault();
    if (!newQuestionText.trim()) return;

    const newQ = {
      id: 'q_' + Date.now(),
      text: newQuestionText.trim(),
    };

    setFormData((prev) => ({
      ...prev,
      questions: [...prev.questions, newQ],
    }));
    setNewQuestionText('');
  };

  const handleRemoveQuestion = (id) => {
    setFormData((prev) => ({
      ...prev,
      questions: prev.questions.filter((q) => q.id !== id),
    }));
  };

  const handleMoveQuestion = (index, direction) => {
    const newQuestions = [...formData.questions];
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= newQuestions.length) return;
    const temp = newQuestions[index];
    newQuestions[index] = newQuestions[targetIndex];
    newQuestions[targetIndex] = temp;
    setFormData((prev) => ({ ...prev, questions: newQuestions }));
  };

  const handleStartEditQuestion = (q) => {
    setEditingQuestionId(q.id);
    setEditingQuestionText(q.text);
  };

  const handleSaveQuestionEdit = (id) => {
    if (!editingQuestionText.trim()) return;
    setFormData((prev) => ({
      ...prev,
      questions: prev.questions.map((q) =>
        q.id === id ? { ...q, text: editingQuestionText.trim() } : q
      ),
    }));
    setEditingQuestionId(null);
    setEditingQuestionText('');
  };

  // Salvar Conversa Direcionada
  const handleSubmitForm = async (e) => {
    e?.preventDefault();
    if (!formData.title.trim()) {
      alert('Por favor, informe o título do tema.');
      return;
    }

    setSaving(true);
    try {
      if (editingId) {
        await updateAdminGuidedConversation(editingId, formData);
        showToast(`Conversa direcionada "${formData.title}" atualizada com sucesso!`);
      } else {
        await createAdminGuidedConversation(formData);
        showToast(`Nova conversa direcionada "${formData.title}" criada com sucesso!`);
      }
      setIsEditing(false);
      setEditingId(null);
      await loadData();
    } catch (err) {
      alert('Erro ao salvar conversa direcionada: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  // Alternar Visibilidade Rápida
  const handleToggleActive = async (conv) => {
    try {
      const updated = !conv.is_active;
      await updateAdminGuidedConversation(conv.id, { is_active: updated });
      setConversations((prev) =>
        prev.map((c) => (c.id === conv.id ? { ...c, is_active: updated } : c))
      );
      showToast(
        `Conversa "${conv.title}" ${updated ? 'publicada para todos os usuários' : 'ocultada'}.`
      );
    } catch (err) {
      alert('Erro ao atualizar status: ' + err.message);
    }
  };

  // Exclusão
  const handleDelete = async (conv) => {
    if (
      !window.confirm(
        `Tem certeza que deseja excluir permanentemente a conversa direcionada "${conv.title}"?`
      )
    ) {
      return;
    }

    try {
      await deleteAdminGuidedConversation(conv.id);
      setConversations((prev) => prev.filter((c) => c.id !== conv.id));
      showToast(`Conversa direcionada "${conv.title}" excluída com sucesso.`);
    } catch (err) {
      alert('Erro ao excluir conversa direcionada: ' + err.message);
    }
  };

  // Categorias únicas existentes para o filtro
  const categories = Array.from(
    new Set(conversations.map((c) => c.category).filter(Boolean))
  );

  const filteredConversations = conversations.filter((c) => {
    const matchesSearch =
      c.title?.toLowerCase().includes(search.toLowerCase()) ||
      c.description?.toLowerCase().includes(search.toLowerCase());
    const matchesCategory =
      categoryFilter === 'all' || c.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const renderIcon = (iconName, className = 'w-5 h-5') => {
    switch (iconName) {
      case 'Zap':
        return <Zap className={className} />;
      case 'Shield':
        return <Shield className={className} />;
      case 'TrendingUp':
        return <TrendingUp className={className} />;
      case 'Heart':
        return <Heart className={className} />;
      case 'BookOpen':
        return <BookOpen className={className} />;
      case 'Target':
        return <Target className={className} />;
      case 'Sparkles':
        return <Sparkles className={className} />;
      case 'Compass':
      default:
        return <Compass className={className} />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Feedback */}
      {feedbackMsg && (
        <div className="p-4 bg-teal-500/10 border border-teal-500/30 rounded-2xl flex items-center gap-3 text-teal-600 dark:text-teal-400 animate-fadeIn">
          <CheckCircle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm font-medium">{feedbackMsg}</p>
        </div>
      )}

      {/* Header Principal */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/70 dark:bg-stone-900/70 backdrop-blur-md p-6 rounded-3xl border border-stone-200/80 dark:border-stone-800 shadow-sm">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-2xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-serif font-bold text-stone-900 dark:text-white">
                Conversas Direcionadas do Sistema
              </h2>
              <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400">
                Crie jornadas temáticas oficiais que serão exibidas para todos os usuários com roteiros de perguntas orientadas.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            disabled={refreshing}
            className="p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-300 transition"
            title="Atualizar lista"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={handleOpenCreate}
            className="px-4 py-2.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white rounded-xl shadow-md flex items-center gap-2 font-medium text-sm transition"
          >
            <Plus className="w-4 h-4" />
            Nova Conversa Direcionada
          </button>
        </div>
      </div>

      {/* Filtros e Busca */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            placeholder="Buscar por tema, objetivo ou pergunta..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white/70 dark:bg-stone-900/70 border border-stone-200 dark:border-stone-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 text-stone-800 dark:text-stone-200"
          />
        </div>

        {categories.length > 0 && (
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3.5 py-2.5 bg-white/70 dark:bg-stone-900/70 border border-stone-200 dark:border-stone-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 text-stone-800 dark:text-stone-200"
          >
            <option value="all">Todas as Categorias</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Modal / Formulário de Edição & Criação */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
            {/* Header do Modal */}
            <div className="px-6 py-5 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center">
                  {renderIcon(formData.icon, 'w-5 h-5')}
                </div>
                <div>
                  <h3 className="font-serif font-bold text-lg text-stone-900 dark:text-white">
                    {editingId ? 'Editar Conversa Direcionada' : 'Criar Nova Conversa Direcionada'}
                  </h3>
                  <p className="text-xs text-stone-500 dark:text-stone-400">
                    Defina o tema e cadastre as perguntas que conduzirão os usuários.
                  </p>
                </div>
              </div>
              <button
                onClick={handleCloseForm}
                className="p-2 rounded-xl text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Corpo do Formulário */}
            <form onSubmit={handleSubmitForm} className="p-6 overflow-y-auto space-y-6 flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Título do Tema */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-1.5">
                    Título do Tema *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Superação da Procrastinação & Foco Inabalável"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-2.5 bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 text-stone-900 dark:text-white"
                  />
                </div>

                {/* Descrição / Orientação */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-1.5">
                    Descrição & Objetivo da Conversa
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Ex: Identifique medos ocultos e estabeleça um micro-passo prático de 5 minutos com a condução do mentor."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-2.5 bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 text-stone-900 dark:text-white"
                  />
                </div>

                {/* Categoria */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-1.5">
                    Categoria
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Foco & Disciplina"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-2.5 bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 text-stone-900 dark:text-white"
                  />
                </div>

                {/* Mentor Responsável */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-1.5">
                    Mentor Recomendado
                  </label>
                  <select
                    value={formData.agent_slug}
                    onChange={(e) => setFormData({ ...formData, agent_slug: e.target.value })}
                    className="w-full px-4 py-2.5 bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 text-stone-900 dark:text-white"
                  >
                    {agents.map((ag) => (
                      <option key={ag.slug || ag.id} value={ag.slug}>
                        {ag.name} ({ag.title || ag.role})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Ícone */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-1.5">
                    Ícone Representativo
                  </label>
                  <select
                    value={formData.icon}
                    onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                    className="w-full px-4 py-2.5 bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 text-stone-900 dark:text-white"
                  >
                    {ICON_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Status Ativo / Rascunho */}
                <div className="flex items-center gap-3 pt-6">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-stone-300 peer-focus:outline-none rounded-full peer dark:bg-stone-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
                  </label>
                  <span className="text-sm font-medium text-stone-700 dark:text-stone-300">
                    {formData.is_active ? 'Publicado para todos os usuários' : 'Oculto / Rascunho'}
                  </span>
                </div>
              </div>

              {/* ROTEIRO DE PERGUNTAS DO TEMA */}
              <div className="pt-4 border-t border-stone-200 dark:border-stone-800">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="text-sm font-bold text-stone-900 dark:text-white flex items-center gap-2">
                      <HelpCircle className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                      Roteiro de Perguntas do Tema ({formData.questions.length})
                    </h4>
                    <p className="text-xs text-stone-500 dark:text-stone-400">
                      Perguntas estruturadas que aparecem como opções clicáveis para o usuário na sessão.
                    </p>
                  </div>
                </div>

                {/* Campo para Adicionar Nova Pergunta */}
                <div className="flex gap-2 mb-4">
                  <input
                    type="text"
                    placeholder="Digite uma pergunta reflexiva sobre o tema..."
                    value={newQuestionText}
                    onChange={(e) => setNewQuestionText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddQuestion();
                      }
                    }}
                    className="flex-1 px-4 py-2.5 bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 text-stone-900 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={handleAddQuestion}
                    className="px-4 py-2.5 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-sm font-medium flex items-center gap-1.5 transition"
                  >
                    <Plus className="w-4 h-4" />
                    Adicionar
                  </button>
                </div>

                {/* Lista de Perguntas */}
                {formData.questions.length === 0 ? (
                  <div className="p-4 bg-stone-50 dark:bg-stone-800/40 rounded-2xl border border-dashed border-stone-200 dark:border-stone-700 text-center">
                    <p className="text-xs text-stone-500 dark:text-stone-400">
                      Nenhuma pergunta cadastrada ainda. Adicione perguntas acima para guiar o usuário.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {formData.questions.map((q, idx) => (
                      <div
                        key={q.id}
                        className="p-3 bg-stone-50 dark:bg-stone-800/60 rounded-xl border border-stone-200/80 dark:border-stone-700 flex items-start gap-3 group"
                      >
                        <span className="w-5 h-5 rounded-full bg-teal-500/10 text-teal-600 dark:text-teal-400 font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                          {idx + 1}
                        </span>

                        <div className="flex-1 min-w-0">
                          {editingQuestionId === q.id ? (
                            <div className="flex gap-2 items-center">
                              <input
                                type="text"
                                value={editingQuestionText}
                                onChange={(e) => setEditingQuestionText(e.target.value)}
                                className="w-full px-3 py-1.5 bg-white dark:bg-stone-900 border border-teal-500 rounded-lg text-sm text-stone-900 dark:text-white focus:outline-none"
                              />
                              <button
                                type="button"
                                onClick={() => handleSaveQuestionEdit(q.id)}
                                className="px-2.5 py-1.5 bg-teal-600 text-white rounded-lg text-xs"
                              >
                                Salvar
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingQuestionId(null)}
                                className="px-2.5 py-1.5 bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-300 rounded-lg text-xs"
                              >
                                Cancelar
                              </button>
                            </div>
                          ) : (
                            <p className="text-sm text-stone-800 dark:text-stone-200 font-medium break-words">
                              {q.text}
                            </p>
                          )}
                        </div>

                        {/* Botões de Ação da Pergunta */}
                        <div className="flex items-center gap-1 opacity-70 group-hover:opacity-100 transition">
                          <button
                            type="button"
                            onClick={() => handleMoveQuestion(idx, -1)}
                            disabled={idx === 0}
                            title="Mover para cima"
                            className="p-1 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 disabled:opacity-30"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMoveQuestion(idx, 1)}
                            disabled={idx === formData.questions.length - 1}
                            title="Mover para baixo"
                            className="p-1 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 disabled:opacity-30"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleStartEditQuestion(q)}
                            title="Editar pergunta"
                            className="p-1 text-stone-400 hover:text-teal-600 dark:hover:text-teal-400"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveQuestion(q.id)}
                            title="Remover pergunta"
                            className="p-1 text-stone-400 hover:text-red-500"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </form>

            {/* Footer do Modal */}
            <div className="px-6 py-4 bg-stone-50 dark:bg-stone-900 border-t border-stone-100 dark:border-stone-800 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={handleCloseForm}
                disabled={saving}
                className="px-4 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-400 text-sm hover:bg-stone-100 dark:hover:bg-stone-800 transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSubmitForm}
                disabled={saving}
                className="px-6 py-2.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white rounded-xl text-sm font-semibold shadow-md flex items-center gap-2 transition disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Salvar Conversa Direcionada
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Grid de Conversas Direcionadas Existentes */}
      {loading ? (
        <div className="flex flex-col items-center justify-center p-12 text-stone-400">
          <Loader2 className="w-8 h-8 animate-spin mb-2 text-teal-600" />
          <p className="text-sm">Carregando conversas direcionadas...</p>
        </div>
      ) : filteredConversations.length === 0 ? (
        <div className="text-center p-12 bg-white/40 dark:bg-stone-900/40 rounded-3xl border border-dashed border-stone-300 dark:border-stone-800">
          <Compass className="w-12 h-12 text-stone-300 dark:text-stone-600 mx-auto mb-3" />
          <h3 className="font-serif font-bold text-stone-800 dark:text-stone-200 text-lg mb-1">
            Nenhuma conversa direcionada encontrada
          </h3>
          <p className="text-sm text-stone-500 dark:text-stone-400 max-w-md mx-auto mb-4">
            {search || categoryFilter !== 'all'
              ? 'Tente ajustar os filtros de busca para encontrar o tema desejado.'
              : 'Crie sua primeira conversa temática oficial para guiar todos os usuários do sistema.'}
          </p>
          <button
            onClick={handleOpenCreate}
            className="px-4 py-2.5 bg-teal-600 hover:bg-teal-500 text-white text-sm font-medium rounded-xl inline-flex items-center gap-2 shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            Criar Primeira Conversa Direcionada
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredConversations.map((conv) => {
            const assignedAgent = agents.find((a) => a.slug === conv.agent_slug);
            const questionsCount = Array.isArray(conv.questions) ? conv.questions.length : 0;

            return (
              <div
                key={conv.id}
                className="bg-white/80 dark:bg-stone-900/80 backdrop-blur-md rounded-3xl border border-stone-200/90 dark:border-stone-800 p-6 flex flex-col justify-between shadow-sm hover:shadow-md transition group"
              >
                <div>
                  {/* Top Bar do Card */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center flex-shrink-0">
                        {renderIcon(conv.icon, 'w-6 h-6')}
                      </div>
                      <div>
                        <span className="px-2.5 py-0.5 bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 rounded-full text-[11px] font-semibold tracking-wide uppercase">
                          {conv.category || 'Geral'}
                        </span>
                        <h3 className="font-serif font-bold text-stone-900 dark:text-white text-base mt-1 line-clamp-1">
                          {conv.title}
                        </h3>
                      </div>
                    </div>

                    {/* Status Pill */}
                    <button
                      onClick={() => handleToggleActive(conv)}
                      title={conv.is_active ? 'Clique para ocultar dos usuários' : 'Clique para publicar para todos'}
                      className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 transition ${
                        conv.is_active
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                          : 'bg-stone-500/10 text-stone-500 dark:text-stone-400 border border-stone-500/20'
                      }`}
                    >
                      {conv.is_active ? (
                        <>
                          <Eye className="w-3 h-3" />
                          Visível
                        </>
                      ) : (
                        <>
                          <EyeOff className="w-3 h-3" />
                          Oculto
                        </>
                      )}
                    </button>
                  </div>

                  {/* Descrição */}
                  <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 line-clamp-2 mb-4">
                    {conv.description || 'Sem descrição cadastrada.'}
                  </p>

                  {/* Amostra das Perguntas */}
                  <div className="space-y-1.5 mb-4">
                    <p className="text-[11px] uppercase tracking-wider font-bold text-stone-400 dark:text-stone-500 flex items-center gap-1.5">
                      <HelpCircle className="w-3 h-3" />
                      Roteiro de Perguntas ({questionsCount}):
                    </p>
                    {questionsCount === 0 ? (
                      <p className="text-xs text-amber-500 italic">Nenhuma pergunta cadastrada.</p>
                    ) : (
                      <div className="space-y-1">
                        {conv.questions.slice(0, 2).map((q, qIdx) => (
                          <div
                            key={q.id || qIdx}
                            className="text-xs text-stone-700 dark:text-stone-300 bg-stone-50 dark:bg-stone-800/40 px-2.5 py-1.5 rounded-lg border border-stone-100 dark:border-stone-800/60 line-clamp-1"
                          >
                            <span className="font-semibold text-teal-600 dark:text-teal-400 mr-1.5">
                              {qIdx + 1}.
                            </span>
                            {q.text}
                          </div>
                        ))}
                        {questionsCount > 2 && (
                          <p className="text-[11px] text-teal-600 dark:text-teal-400 font-medium pl-1">
                            +{questionsCount - 2} pergunta(s) no roteiro...
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer do Card */}
                <div className="pt-3 border-t border-stone-100 dark:border-stone-800/80 flex items-center justify-between text-xs text-stone-500">
                  <div className="flex items-center gap-2">
                    {assignedAgent?.avatar_url ? (
                      <img
                        src={assignedAgent.avatar_url}
                        alt={assignedAgent.name}
                        className="w-5 h-5 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-teal-500/20 text-teal-700 text-[10px] flex items-center justify-center font-bold">
                        {assignedAgent?.name?.[0] || 'I'}
                      </div>
                    )}
                    <span className="font-medium text-stone-700 dark:text-stone-300 truncate max-w-[130px]">
                      {assignedAgent?.name || conv.agent_slug}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(conv)}
                      className="p-2 rounded-xl text-stone-500 hover:text-teal-600 hover:bg-stone-100 dark:hover:bg-stone-800 transition"
                      title="Editar tema e perguntas"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(conv)}
                      className="p-2 rounded-xl text-stone-500 hover:text-red-500 hover:bg-stone-100 dark:hover:bg-stone-800 transition"
                      title="Excluir conversa direcionada"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
