import React, { useState, useEffect } from 'react';
import {
  Users,
  Feather,
  Shield,
  Search,
  Save,
  RefreshCw,
  Sliders,
  CheckCircle,
  AlertCircle,
  Bookmark,
  Plus,
  Trash2,
  Compass,
  Heart,
  BookOpen,
  HelpCircle,
  CreditCard,
  QrCode,
  UserCheck,
  UserX,
  MessageSquare,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Send,
  Lightbulb,
} from 'lucide-react';
import {
  fetchAdminMetrics,
  fetchAdminUsers,
  updateRole,
  fetchAdminMemories,
  fetchAdminAgents,
  updateAgent,
  deleteAgent,
  fetchAdminPlans,
  updateAdminPlan,
  updateUserStatus,
  updateUserPlan,
  fetchAdminSubscriptions,
  approveSubscription,
  fetchAdminFeedbacks,
} from '../services/adminApi';
import CreateAgentModal from './CreateAgentModal';
import AgentKnowledgeManager from './AgentKnowledgeManager';
import AdminHelpGuide from './AdminHelpGuide';

export default function AdminDashboard({ currentUser }) {
  const [activeTab, setActiveTab] = useState('metrics'); // 'users' | 'plans' | 'subscriptions' | 'feedbacks' | 'memories' | 'agents' | 'help'
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isCreateAgentOpen, setIsCreateAgentOpen] = useState(false);

  // Dados do Sistema
  const [metrics, setMetrics] = useState(null);
  const [users, setUsers] = useState([]);
  const [memories, setMemories] = useState([]);
  const [agents, setAgents] = useState([]);
  const [plans, setPlans] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);

  // Filtros e busca
  const [userSearch, setUserSearch] = useState('');
  const [memoryFilter, setMemoryFilter] = useState('all');
  const [feedbackMsg, setFeedbackMsg] = useState('');

  // Agente em edição
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [agentPrompt, setAgentPrompt] = useState('');
  const [agentTemp, setAgentTemp] = useState(0.7);

  // Plano em edição
  const [selectedPlanId, setSelectedPlanId] = useState('pro_monthly');
  const [editingPlan, setEditingPlan] = useState(null);
  const [featuresText, setFeaturesText] = useState('');
  const [savingPlan, setSavingPlan] = useState(false);

  const loadAllData = async () => {
    try {
      setRefreshing(true);
      const [m, u, mem, ag, p, s, f] = await Promise.all([
        fetchAdminMetrics().catch(() => null),
        fetchAdminUsers().catch(() => []),
        fetchAdminMemories().catch(() => []),
        fetchAdminAgents().catch(() => []),
        fetchAdminPlans().catch(() => []),
        fetchAdminSubscriptions().catch(() => []),
        fetchAdminFeedbacks().catch(() => []),
      ]);

      setMetrics(m);
      setUsers(u);
      setMemories(mem);
      setAgents(ag);
      setPlans(p);
      setSubscriptions(s);
      setFeedbacks(f);

      if (ag.length > 0 && !selectedAgent) {
        setSelectedAgent(ag[0]);
        setAgentPrompt(ag[0].system_prompt);
        setAgentTemp(Number(ag[0].temperature) || 0.7);
      }

      if (p.length > 0) {
        const curPlan = p.find((item) => item.id === selectedPlanId) || p[0];
        setEditingPlan({ ...curPlan });
        setFeaturesText(Array.isArray(curPlan.features) ? curPlan.features.join('\n') : '');
      }
    } catch (err) {
      console.error('Erro ao carregar dados do admin:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // Quando o superadmin troca o plano a ser editado
  const handleSelectPlanToEdit = (planId) => {
    setSelectedPlanId(planId);
    const target = plans.find((p) => p.id === planId);
    if (target) {
      setEditingPlan({ ...target });
      setFeaturesText(Array.isArray(target.features) ? target.features.join('\n') : '');
    }
  };

  // Salvar alterações de um plano (Preço, Chave PIX, Titular, etc.)
  const handleSavePlan = async (e) => {
    e?.preventDefault();
    if (!editingPlan) return;
    setSavingPlan(true);

    try {
      const featuresArray = featuresText
        .split('\n')
        .map((f) => f.trim())
        .filter((f) => f.length > 0);

      const payload = {
        ...editingPlan,
        features: featuresArray,
      };

      await updateAdminPlan(editingPlan.id, payload);
      setFeedbackMsg(`Plano "${editingPlan.name}" e dados PIX atualizados com sucesso!`);
      setTimeout(() => setFeedbackMsg(''), 3500);
      loadAllData();
    } catch (err) {
      alert('Erro ao salvar plano: ' + err.message);
    } finally {
      setSavingPlan(false);
    }
  };

  // Bloquear ou desbloquear acesso geral de um cliente
  const handleToggleUserStatus = async (userId, currentStatus) => {
    const newStatus = currentStatus === false ? true : false;
    try {
      await updateUserStatus(userId, newStatus);
      setFeedbackMsg(`Acesso do usuário ${newStatus ? 'liberado/ativado' : 'bloqueado/desativado'} com sucesso!`);
      setTimeout(() => setFeedbackMsg(''), 3000);
      loadAllData();
    } catch (err) {
      alert('Erro ao alterar status de acesso: ' + err.message);
    }
  };

  // Alterar plano de um cliente diretamente no dropdown
  const handleUserPlanChange = async (userId, newPlanId) => {
    try {
      await updateUserPlan(userId, newPlanId);
      setFeedbackMsg('Plano do cliente atualizado com sucesso!');
      setTimeout(() => setFeedbackMsg(''), 3000);
      loadAllData();
    } catch (err) {
      alert('Erro ao atualizar plano do cliente: ' + err.message);
    }
  };

  // Aprovar pedido PIX e ativar o plano do cliente
  const handleApproveSubscription = async (subId) => {
    try {
      await approveSubscription(subId, currentUser?.id);
      setFeedbackMsg('Assinatura PIX aprovada! Plano ativado e e-mail enviado ao cliente.');
      setTimeout(() => setFeedbackMsg(''), 3500);
      loadAllData();
    } catch (err) {
      alert('Erro ao aprovar assinatura: ' + err.message);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await updateRole(userId, newRole);
      setFeedbackMsg('Papel do usuário atualizado com sucesso!');
      setTimeout(() => setFeedbackMsg(''), 3000);
      loadAllData();
    } catch (err) {
      alert('Erro ao alterar role: ' + err.message);
    }
  };

  const handleSaveAgent = async (e) => {
    e?.preventDefault();
    if (!selectedAgent) return;
    try {
      await updateAgent(selectedAgent.id, {
        system_prompt: agentPrompt,
        temperature: agentTemp,
      });
      setFeedbackMsg('Diretrizes do Mentor atualizadas com sucesso!');
      setTimeout(() => setFeedbackMsg(''), 3000);
      loadAllData();
    } catch (err) {
      alert('Erro ao atualizar mentor: ' + err.message);
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.email?.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.full_name?.toLowerCase().includes(userSearch.toLowerCase())
  );

  const filteredMemories = memories.filter((m) => {
    if (memoryFilter === 'all') return true;
    return m.category === memoryFilter;
  });

  const pendingSubsCount = subscriptions.filter((s) => s.status === 'pending').length;
  const activeSubscribersCount = users.filter((u) => u.plan_id && u.plan_id !== 'free').length;

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-slate-900 text-stone-800 dark:text-stone-100 p-3.5 sm:p-8 font-sans transition-colors duration-300">
      <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
        {/* CABEÇALHO DO PAINEL */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 sm:pb-6 border-b border-stone-200/80 dark:border-slate-800">
          <div>
            <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-teal-700/10 dark:bg-teal-500/15 border border-teal-700/20 dark:border-teal-500/30 flex items-center justify-center text-teal-800 dark:text-teal-400 shrink-0">
                <Shield className="w-4 h-4 sm:w-5 sm:h-5 stroke-[1.75]" />
              </div>
              <h1 className="text-xl sm:text-3xl font-serif font-medium text-stone-900 dark:text-stone-50 tracking-tight">
                Painel de Gestão
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-serif bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 border border-teal-200/80 dark:border-teal-800/40">
                SUPER ADMIN
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-stone-500 dark:text-stone-400 mt-1 font-serif">
              Controle total de planos, pagamentos PIX, bloqueio de clientes e suporte Lynx
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setActiveTab('help')}
              className={`px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-2xl border text-xs font-medium transition flex items-center gap-1.5 sm:gap-2 shadow-sm active:scale-95 ${
                activeTab === 'help'
                  ? 'bg-teal-700 text-white border-teal-700'
                  : 'bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/50 border-amber-200/80 dark:border-amber-800/60 text-amber-800 dark:text-amber-300'
              }`}
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Manual do Admin</span>
            </button>

            <button
              onClick={loadAllData}
              disabled={refreshing}
              className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-2xl bg-white dark:bg-slate-800 hover:bg-stone-100 dark:hover:bg-slate-700 border border-stone-200 dark:border-slate-700 text-xs font-medium text-stone-700 dark:text-stone-300 transition flex items-center gap-1.5 sm:gap-2 shadow-sm active:scale-95"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-teal-700' : ''}`} />
              <span>Atualizar</span>
            </button>
          </div>
        </div>

        {feedbackMsg && (
          <div className="p-3.5 sm:p-4 rounded-2xl sm:rounded-3xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2 animate-fadeIn">
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span>{feedbackMsg}</span>
          </div>
        )}

        {/* CARTÕES DE MÉTRICAS */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
          <div className="p-3.5 sm:p-6 rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-800/80 border border-stone-200/80 dark:border-slate-700 shadow-sm">
            <div className="flex items-center justify-between text-stone-500 dark:text-stone-400 mb-1.5 sm:mb-2">
              <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider">Usuários</span>
              <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-teal-700 dark:text-teal-400" />
            </div>
            <span className="text-xl sm:text-3xl font-serif font-medium text-stone-900 dark:text-stone-50">
              {metrics?.totalUsers ?? '...'}
            </span>
            <span className="block text-[10px] sm:text-[11px] text-stone-400 dark:text-stone-500 mt-0.5 sm:mt-1">
              Cadastros registrados
            </span>
          </div>

          <div className="p-3.5 sm:p-6 rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-800/80 border border-stone-200/80 dark:border-slate-700 shadow-sm">
            <div className="flex items-center justify-between text-stone-500 dark:text-stone-400 mb-1.5 sm:mb-2">
              <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider">Assinantes Ativos</span>
              <CreditCard className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-700 dark:text-amber-400" />
            </div>
            <span className="text-xl sm:text-3xl font-serif font-medium text-amber-800 dark:text-amber-300">
              {activeSubscribersCount}
            </span>
            <span className="block text-[10px] sm:text-[11px] text-stone-400 dark:text-stone-500 mt-0.5 sm:mt-1">
              Planos Mensal ou Anual
            </span>
          </div>

          <div className="p-3.5 sm:p-6 rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-800/80 border border-stone-200/80 dark:border-slate-700 shadow-sm">
            <div className="flex items-center justify-between text-stone-500 dark:text-stone-400 mb-1.5 sm:mb-2">
              <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider">Pedidos PIX</span>
              <QrCode className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-teal-700 dark:text-teal-400" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xl sm:text-3xl font-serif font-medium text-stone-900 dark:text-stone-50">
                {subscriptions.length}
              </span>
              {pendingSubsCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-white animate-pulse">
                  {pendingSubsCount} pendente(s)
                </span>
              )}
            </div>
            <span className="block text-[10px] sm:text-[11px] text-stone-400 dark:text-stone-500 mt-0.5 sm:mt-1">
              Transações geradas
            </span>
          </div>

          <div className="p-3.5 sm:p-6 rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-800/80 border border-stone-200/80 dark:border-slate-700 shadow-sm">
            <div className="flex items-center justify-between text-stone-500 dark:text-stone-400 mb-1.5 sm:mb-2">
              <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider">Chamados Lynx</span>
              <MessageSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-teal-700 dark:text-teal-400" />
            </div>
            <span className="text-xl sm:text-3xl font-serif font-medium text-teal-800 dark:text-teal-300">
              {feedbacks.length}
            </span>
            <span className="block text-[10px] sm:text-[11px] text-stone-400 dark:text-stone-500 mt-0.5 sm:mt-1">
              Sugestões / Reclamações
            </span>
          </div>
        </div>

        {/* NAVEGAÇÃO DE ABAS */}
        <div className="flex overflow-x-auto pb-1 max-w-full -mx-2 px-2 sm:mx-0 sm:px-0 no-scrollbar">
          <div className="inline-flex p-1.5 rounded-2xl bg-stone-200/60 dark:bg-slate-800/60 border border-stone-300/50 dark:border-slate-700/50 text-xs font-medium whitespace-nowrap shrink-0 gap-1">
            <button
              onClick={() => setActiveTab('users')}
              className={`px-3 sm:px-4 py-2 rounded-xl transition flex items-center gap-2 ${
                activeTab === 'users'
                  ? 'bg-teal-700 text-white shadow-sm'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              Usuários & Acessos ({users.length})
            </button>

            <button
              onClick={() => setActiveTab('plans')}
              className={`px-3 sm:px-4 py-2 rounded-xl transition flex items-center gap-2 ${
                activeTab === 'plans'
                  ? 'bg-teal-700 text-white shadow-sm'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
              }`}
            >
              <CreditCard className="w-3.5 h-3.5" />
              Configurar Planos & PIX
            </button>

            <button
              onClick={() => setActiveTab('subscriptions')}
              className={`px-3 sm:px-4 py-2 rounded-xl transition flex items-center gap-2 ${
                activeTab === 'subscriptions'
                  ? 'bg-teal-700 text-white shadow-sm'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
              }`}
            >
              <QrCode className="w-3.5 h-3.5" />
              Assinaturas PIX ({pendingSubsCount > 0 ? `${pendingSubsCount} Pendentes` : subscriptions.length})
            </button>

            <button
              onClick={() => setActiveTab('feedbacks')}
              className={`px-3 sm:px-4 py-2 rounded-xl transition flex items-center gap-2 ${
                activeTab === 'feedbacks'
                  ? 'bg-teal-700 text-white shadow-sm'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              Chamados & Suporte ({feedbacks.length})
            </button>

            <button
              onClick={() => setActiveTab('memories')}
              className={`px-3 sm:px-4 py-2 rounded-xl transition flex items-center gap-2 ${
                activeTab === 'memories'
                  ? 'bg-teal-700 text-white shadow-sm'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
              }`}
            >
              <Bookmark className="w-3.5 h-3.5" />
              Lembranças ({memories.length})
            </button>

            <button
              onClick={() => setActiveTab('agents')}
              className={`px-3 sm:px-4 py-2 rounded-xl transition flex items-center gap-2 ${
                activeTab === 'agents'
                  ? 'bg-teal-700 text-white shadow-sm'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              Mentores & Estudos
            </button>

            <button
              onClick={() => setActiveTab('help')}
              className={`px-3 sm:px-4 py-2 rounded-xl transition flex items-center gap-2 ${
                activeTab === 'help'
                  ? 'bg-teal-700 text-white shadow-sm'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
              }`}
            >
              <HelpCircle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>Manual</span>
            </button>
          </div>
        </div>

        {/* ABA 1: GERENCIAR USUÁRIOS E CONTROLE DE ACESSO */}
        {activeTab === 'users' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between gap-4 items-center">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-stone-400" />
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="Buscar por nome ou e-mail..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white dark:bg-slate-800 border border-stone-300 dark:border-slate-700 text-xs text-stone-800 dark:text-stone-100 placeholder-stone-400 outline-none focus:border-teal-700"
                />
              </div>
            </div>

            <div className="overflow-x-auto rounded-3xl border border-stone-200/80 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm">
              <table className="w-full text-left text-xs text-stone-700 dark:text-stone-300">
                <thead className="bg-stone-100/70 dark:bg-slate-850 uppercase font-semibold text-[11px] text-stone-500 border-b border-stone-200/80 dark:border-slate-700">
                  <tr>
                    <th className="p-4">Cliente / E-mail</th>
                    <th className="p-4">Papel</th>
                    <th className="p-4">Plano Atual</th>
                    <th className="p-4">Status de Acesso</th>
                    <th className="p-4">Data de Cadastro</th>
                    <th className="p-4 text-right">Ação de Bloqueio</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200/60 dark:divide-slate-700/60">
                  {filteredUsers.map((u) => {
                    const isActive = u.is_active !== false;
                    const planId = u.plan_id || 'free';

                    return (
                      <tr key={u.id} className="hover:bg-stone-50/70 dark:hover:bg-slate-750 transition">
                        <td className="p-4">
                          <div className="font-serif font-medium text-stone-900 dark:text-stone-100 text-sm">
                            {u.full_name || 'Sem nome'}
                          </div>
                          <div className="text-[11px] text-stone-400">{u.email}</div>
                        </td>

                        <td className="p-4">
                          <select
                            value={u.role}
                            onChange={(e) => handleRoleChange(u.id, e.target.value)}
                            className="bg-stone-50 dark:bg-slate-900 border border-stone-300 dark:border-slate-700 text-xs rounded-xl px-2.5 py-1 text-stone-800 dark:text-stone-200 outline-none focus:border-teal-700"
                          >
                            <option value="user">user</option>
                            <option value="admin">admin</option>
                            <option value="master">master</option>
                          </select>
                        </td>

                        {/* PLANO ATUAL EDITÁVEL PELO SUPERADMIN */}
                        <td className="p-4">
                          <select
                            value={planId}
                            onChange={(e) => handleUserPlanChange(u.id, e.target.value)}
                            className={`text-xs rounded-xl px-2.5 py-1 font-medium border outline-none ${
                              planId === 'pro_annual'
                                ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-300'
                                : planId === 'pro_monthly'
                                ? 'bg-teal-50 dark:bg-teal-950/40 text-teal-800 dark:text-teal-300 border-teal-300'
                                : 'bg-stone-100 dark:bg-slate-700 text-stone-600 dark:text-stone-300 border-stone-300'
                            }`}
                          >
                            <option value="free">Gratuito (free)</option>
                            <option value="pro_monthly">Mensal (R$ 29,90)</option>
                            <option value="pro_annual">Anual (R$ 247,00)</option>
                          </select>
                        </td>

                        {/* STATUS DE ACESSO */}
                        <td className="p-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              isActive
                                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                                : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                            }`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-600' : 'bg-rose-600'}`} />
                            {isActive ? 'Ativo' : 'Bloqueado'}
                          </span>
                        </td>

                        <td className="p-4 text-stone-400">
                          {new Date(u.created_at).toLocaleDateString('pt-BR')}
                        </td>

                        {/* BOTÃO PARA ATIVAR / BLOQUEAR */}
                        <td className="p-4 text-right">
                          <button
                            type="button"
                            onClick={() => handleToggleUserStatus(u.id, isActive)}
                            className={`px-3 py-1 rounded-xl text-xs font-semibold transition active:scale-95 flex items-center gap-1.5 ml-auto ${
                              isActive
                                ? 'bg-rose-100 dark:bg-rose-950/50 hover:bg-rose-200 text-rose-800 dark:text-rose-300'
                                : 'bg-emerald-100 dark:bg-emerald-950/50 hover:bg-emerald-200 text-emerald-800 dark:text-emerald-300'
                            }`}
                          >
                            {isActive ? (
                              <>
                                <UserX className="w-3.5 h-3.5" />
                                <span>Bloquear Acesso</span>
                              </>
                            ) : (
                              <>
                                <UserCheck className="w-3.5 h-3.5" />
                                <span>Liberar Acesso</span>
                              </>
                            )}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ABA 2: CONFIGURAR PLANOS E DADOS PIX */}
        {activeTab === 'plans' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* LISTA DE PLANOS CADASTRADOS */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-stone-500 mb-2">
                Planos do Santuário
              </h3>
              {plans.map((p) => {
                const isSelected = selectedPlanId === p.id;
                return (
                  <div
                    key={p.id}
                    onClick={() => handleSelectPlanToEdit(p.id)}
                    className={`p-4 rounded-3xl border transition cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'bg-white dark:bg-slate-800 border-teal-700 shadow-md ring-2 ring-teal-700/20'
                        : 'bg-stone-100/70 dark:bg-slate-800/50 border-stone-200 dark:border-slate-700 hover:border-teal-500/40'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-serif font-medium text-sm text-stone-900 dark:text-stone-100">
                        {p.name}
                      </span>
                      <span className="text-xs font-bold text-teal-800 dark:text-teal-300">
                        R$ {Number(p.price).toFixed(2).replace('.', ',')}
                      </span>
                    </div>
                    <span className="text-[11px] text-stone-400 mt-1">
                      Ciclo: {p.billing_cycle === 'annual' ? 'Anual (365 dias)' : 'Mensal (30 dias)'}
                    </span>
                    <span className="text-[11px] text-teal-700 dark:text-teal-400 mt-0.5">
                      Chave PIX: {p.pix_key || 'Não cadastrada'}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* FORMULÁRIO DE EDIÇÃO COMPLETO */}
            <div className="md:col-span-2 p-6 sm:p-8 rounded-4xl bg-white dark:bg-slate-800/80 border border-stone-200/80 dark:border-slate-700 shadow-sm space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-stone-100 dark:border-slate-700">
                <div>
                  <h3 className="text-base font-serif font-medium text-stone-900 dark:text-stone-50">
                    Editar Plano: {editingPlan?.name}
                  </h3>
                  <p className="text-xs text-stone-500 dark:text-stone-400">
                    Altere o valor em Reais, a chave PIX de recebimento e os dados do titular.
                  </p>
                </div>
              </div>

              {editingPlan ? (
                <form onSubmit={handleSavePlan} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
                        Nome do Plano
                      </label>
                      <input
                        type="text"
                        required
                        value={editingPlan.name || ''}
                        onChange={(e) => setEditingPlan({ ...editingPlan, name: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-2xl bg-stone-50 dark:bg-slate-900 border border-stone-300 dark:border-slate-700 text-xs text-stone-800 dark:text-stone-200 outline-none focus:border-teal-700 transition"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
                        Valor em Reais (R$)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        required
                        value={editingPlan.price || 0}
                        onChange={(e) => setEditingPlan({ ...editingPlan, price: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-2xl bg-stone-50 dark:bg-slate-900 border border-stone-300 dark:border-slate-700 text-xs text-stone-800 dark:text-stone-200 outline-none focus:border-teal-700 transition"
                      />
                    </div>
                  </div>

                  {/* CONFIGURAÇÃO DA CHAVE PIX */}
                  <div className="p-4 rounded-3xl bg-teal-50/50 dark:bg-teal-950/20 border border-teal-200/60 dark:border-teal-900/60 space-y-4">
                    <div className="flex items-center gap-2 text-teal-800 dark:text-teal-300 text-xs font-semibold">
                      <QrCode className="w-4 h-4" />
                      <span>Configurações da Chave PIX Oficial</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
                          Chave PIX (E-mail, CNPJ, CPF, Telefone ou Aleatória)
                        </label>
                        <input
                          type="text"
                          required
                          value={editingPlan.pix_key || ''}
                          onChange={(e) => setEditingPlan({ ...editingPlan, pix_key: e.target.value })}
                          placeholder="Ex: suporte@lynxems.com.br ou 00.000.000/0001-00"
                          className="w-full px-4 py-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-stone-300 dark:border-slate-700 text-xs text-stone-800 dark:text-stone-200 outline-none focus:border-teal-700 transition"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
                          Tipo da Chave
                        </label>
                        <select
                          value={editingPlan.pix_key_type || 'email'}
                          onChange={(e) => setEditingPlan({ ...editingPlan, pix_key_type: e.target.value })}
                          className="w-full px-4 py-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-stone-300 dark:border-slate-700 text-xs text-stone-800 dark:text-stone-200 outline-none focus:border-teal-700 transition"
                        >
                          <option value="email">E-mail</option>
                          <option value="cnpj">CNPJ</option>
                          <option value="cpf">CPF</option>
                          <option value="telefone">Telefone</option>
                          <option value="aleatoria">Chave Aleatória (EVP)</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
                        Nome do Favorecido / Titular da Conta
                      </label>
                      <input
                        type="text"
                        value={editingPlan.pix_beneficiary || ''}
                        onChange={(e) => setEditingPlan({ ...editingPlan, pix_beneficiary: e.target.value })}
                        placeholder="Ex: Lynx EMS Soluções Tecnológicas"
                        className="w-full px-4 py-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-stone-300 dark:border-slate-700 text-xs text-stone-800 dark:text-stone-200 outline-none focus:border-teal-700 transition"
                      />
                    </div>
                  </div>

                  {/* AVISO DE ATIVAÇÃO DE 10 MINUTOS */}
                  <div>
                    <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
                      Aviso Exibido ao Usuário (Prazo de Ativação)
                    </label>
                    <textarea
                      rows={2}
                      value={editingPlan.activation_notice || ''}
                      onChange={(e) => setEditingPlan({ ...editingPlan, activation_notice: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-2xl bg-stone-50 dark:bg-slate-900 border border-stone-300 dark:border-slate-700 text-xs text-stone-800 dark:text-stone-200 outline-none focus:border-teal-700 transition resize-none"
                    />
                  </div>

                  {/* DESCRIÇÃO E BENEFÍCIOS */}
                  <div>
                    <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
                      Descrição Resumida
                    </label>
                    <input
                      type="text"
                      value={editingPlan.description || ''}
                      onChange={(e) => setEditingPlan({ ...editingPlan, description: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-2xl bg-stone-50 dark:bg-slate-900 border border-stone-300 dark:border-slate-700 text-xs text-stone-800 dark:text-stone-200 outline-none focus:border-teal-700 transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
                      Benefícios do Plano (1 por linha)
                    </label>
                    <textarea
                      rows={4}
                      value={featuresText}
                      onChange={(e) => setFeaturesText(e.target.value)}
                      placeholder="Conversas sem limite&#10;Voz neural Charon e Aoede&#10;Suporte prioritário Lynx"
                      className="w-full px-4 py-2.5 rounded-2xl bg-stone-50 dark:bg-slate-900 border border-stone-300 dark:border-slate-700 text-xs text-stone-800 dark:text-stone-200 outline-none focus:border-teal-700 transition font-mono"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={savingPlan}
                    className="px-6 py-3 rounded-2xl bg-teal-700 hover:bg-teal-800 text-white font-medium text-xs shadow-md shadow-teal-700/20 transition flex items-center gap-2 disabled:opacity-50 active:scale-95"
                  >
                    <Save className="w-4 h-4" />
                    <span>{savingPlan ? 'Salvando...' : 'Salvar Alterações do Plano'}</span>
                  </button>
                </form>
              ) : (
                <div className="py-12 text-center text-xs text-stone-400">
                  Selecione um plano à esquerda para editar.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ABA 3: PEDIDOS DE ASSINATURA PIX */}
        {activeTab === 'subscriptions' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-stone-500">
                Histórico de Pedidos de Assinatura
              </h3>
              <span className="text-xs text-stone-400 font-serif">
                Total de pedidos: {subscriptions.length}
              </span>
            </div>

            <div className="overflow-x-auto rounded-3xl border border-stone-200/80 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm">
              <table className="w-full text-left text-xs text-stone-700 dark:text-stone-300">
                <thead className="bg-stone-100/70 dark:bg-slate-850 uppercase font-semibold text-[11px] text-stone-500 border-b border-stone-200/80 dark:border-slate-700">
                  <tr>
                    <th className="p-4">Cliente</th>
                    <th className="p-4">Plano Escolhido</th>
                    <th className="p-4">Valor</th>
                    <th className="p-4">Data do Pedido</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Aprovação Superadmin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200/60 dark:divide-slate-700/60">
                  {subscriptions.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="p-8 text-center text-stone-400 text-xs">
                        Nenhum pedido de assinatura registrado até o momento.
                      </td>
                    </tr>
                  ) : (
                    subscriptions.map((sub) => {
                      const isPending = sub.status === 'pending';
                      const isActive = sub.status === 'active';

                      return (
                        <tr key={sub.id} className="hover:bg-stone-50/70 dark:hover:bg-slate-750 transition">
                          <td className="p-4">
                            <div className="font-serif font-medium text-stone-900 dark:text-stone-100">
                              {sub.user_name || 'Cliente'}
                            </div>
                            <div className="text-[11px] text-stone-400">{sub.user_email}</div>
                          </td>

                          <td className="p-4 font-medium text-stone-800 dark:text-stone-200">
                            {sub.plan?.name || sub.plan_id}
                          </td>

                          <td className="p-4 font-semibold text-teal-800 dark:text-teal-300">
                            R$ {Number(sub.amount).toFixed(2).replace('.', ',')}
                          </td>

                          <td className="p-4 text-stone-400">
                            {new Date(sub.created_at).toLocaleString('pt-BR')}
                          </td>

                          <td className="p-4">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                isActive
                                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200'
                                  : isPending
                                  ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 animate-pulse'
                                  : 'bg-stone-100 dark:bg-slate-700 text-stone-500'
                              }`}
                            >
                              {isActive ? 'Ativo / Pago' : isPending ? 'Pendente de PIX' : sub.status}
                            </span>
                          </td>

                          <td className="p-4 text-right">
                            {isPending ? (
                              <button
                                type="button"
                                onClick={() => handleApproveSubscription(sub.id)}
                                className="px-3.5 py-1.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-semibold text-xs transition active:scale-95 shadow-sm inline-flex items-center gap-1.5"
                              >
                                <CheckCircle className="w-3.5 h-3.5" />
                                <span>Aprovar & Ativar Plano</span>
                              </button>
                            ) : (
                              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                                Aprovado em {sub.approved_at ? new Date(sub.approved_at).toLocaleDateString('pt-BR') : 'OK'}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ABA 4: CHAMADOS E MENSAGENS DE SUPORTE */}
        {activeTab === 'feedbacks' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-stone-500">
                Mensagens e Sugestões Enviadas por Assinantes
              </h3>
              <span className="text-xs text-stone-400 font-serif">
                Total recebido: {feedbacks.length}
              </span>
            </div>

            <div className="space-y-3">
              {feedbacks.length === 0 ? (
                <div className="p-8 text-center text-stone-400 text-xs rounded-3xl bg-white dark:bg-slate-800 border border-stone-200/80 dark:border-slate-700">
                  Nenhuma mensagem de suporte recebida ainda.
                </div>
              ) : (
                feedbacks.map((fb) => {
                  const typeBadgeMap = {
                    suggestion: 'bg-teal-50 text-teal-800 border-teal-200',
                    complaint: 'bg-rose-50 text-rose-800 border-rose-200',
                    support: 'bg-blue-50 text-blue-800 border-blue-200',
                    praise: 'bg-amber-50 text-amber-800 border-amber-200',
                  };

                  return (
                    <div
                      key={fb.id}
                      className="p-5 rounded-3xl bg-white dark:bg-slate-800 border border-stone-200/80 dark:border-slate-700 shadow-sm space-y-2.5"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wider border ${
                              typeBadgeMap[fb.type] || 'bg-stone-100 text-stone-700 border-stone-200'
                            }`}
                          >
                            {fb.type}
                          </span>
                          <h4 className="font-serif font-medium text-sm text-stone-900 dark:text-stone-100">
                            {fb.subject}
                          </h4>
                        </div>
                        <span className="text-[11px] text-stone-400">
                          {new Date(fb.created_at).toLocaleString('pt-BR')}
                        </span>
                      </div>

                      <div className="text-xs text-stone-500 dark:text-stone-400">
                        De: <strong>{fb.user_name}</strong> ({fb.user_email}) • Plano: <strong>{fb.user_plan || 'free'}</strong>
                      </div>

                      <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-slate-900 text-xs text-stone-700 dark:text-stone-300 leading-relaxed whitespace-pre-wrap">
                        {fb.message}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* ABA 5: LEMBRANÇAS DE SESSÕES */}
        {activeTab === 'memories' && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {['all', 'blocker', 'belief', 'pattern', 'goal', 'trauma'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setMemoryFilter(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs capitalize transition ${
                    memoryFilter === cat
                      ? 'bg-teal-700 text-white shadow-sm'
                      : 'bg-white dark:bg-slate-800 border border-stone-200 dark:border-slate-700 text-stone-600 dark:text-stone-400 hover:text-stone-900'
                  }`}
                >
                  {cat === 'all' ? 'Todas' : cat}
                </button>
              ))}
            </div>

            <div className="grid gap-3">
              {filteredMemories.length === 0 ? (
                <div className="p-8 text-center text-stone-400 text-xs rounded-3xl bg-white dark:bg-slate-800 border border-stone-200/80 dark:border-slate-700">
                  Nenhuma lembrança registrada nesta categoria ainda.
                </div>
              ) : (
                filteredMemories.map((m) => (
                  <div
                    key={m.id}
                    className="p-4 rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-800/80 border border-stone-200/80 dark:border-slate-700 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between text-stone-400">
                      <span className="capitalize text-teal-800 dark:text-teal-400 font-medium">
                        {m.category}
                      </span>
                      <span>{new Date(m.created_at).toLocaleDateString('pt-BR')}</span>
                    </div>
                    <p className="text-stone-700 dark:text-stone-200 font-serif leading-relaxed">
                      {m.content}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ABA 6: GESTÃO DE MENTORES E ESTUDOS */}
        {activeTab === 'agents' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                  Mentores Ativos
                </span>
                <button
                  onClick={() => setIsCreateAgentOpen(true)}
                  className="px-2.5 py-1 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-medium transition flex items-center gap-1 shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Novo Mentor</span>
                </button>
              </div>

              {agents.map((ag) => (
                <div
                  key={ag.id}
                  onClick={() => {
                    setSelectedAgent(ag);
                    setAgentPrompt(ag.system_prompt);
                    setAgentTemp(Number(ag.temperature) || 0.7);
                  }}
                  className={`p-4 rounded-3xl border transition cursor-pointer flex items-center justify-between ${
                    selectedAgent?.id === ag.id
                      ? 'bg-white dark:bg-slate-800 border-teal-700 shadow-md ring-2 ring-teal-700/20'
                      : 'bg-stone-100/70 dark:bg-slate-800/50 border-stone-200 dark:border-slate-700 hover:border-teal-500/40'
                  }`}
                >
                  <div>
                    <div className="font-serif font-medium text-stone-900 dark:text-stone-100">
                      {ag.name}
                    </div>
                    <div className="text-xs text-stone-400 mt-0.5">Identificador: {ag.slug}</div>
                  </div>

                  {ag.slug !== 'izaque-master' && (
                    <button
                      onClick={async (e) => {
                        e.stopPropagation();
                        if (confirm(`Deseja remover o mentor "${ag.name}"?`)) {
                          try {
                            await deleteAgent(ag.id);
                            loadAllData();
                          } catch (err) {
                            alert(err.message);
                          }
                        }
                      }}
                      title="Excluir Especialista"
                      className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-stone-100 dark:hover:bg-slate-700 rounded-xl transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className="md:col-span-2 p-6 sm:p-8 rounded-4xl bg-white dark:bg-slate-800/80 border border-stone-200/80 dark:border-slate-700 space-y-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-serif font-medium text-stone-900 dark:text-stone-50">
                    Diretrizes do Mentor: {selectedAgent?.name}
                  </h3>
                  <p className="text-xs text-stone-500 dark:text-stone-400">
                    Instruções de tom de voz mansa, reticências para pausas e postura de escuta atenta.
                  </p>
                </div>
              </div>

              <form onSubmit={handleSaveAgent} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1.5">
                    Instrução de Persona & Fala
                  </label>
                  <textarea
                    rows={8}
                    value={agentPrompt}
                    onChange={(e) => setAgentPrompt(e.target.value)}
                    className="w-full p-4 rounded-2xl bg-stone-50 dark:bg-slate-900 border border-stone-300 dark:border-slate-700 text-xs font-mono text-stone-800 dark:text-stone-200 leading-relaxed outline-none focus:border-teal-700 transition"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs text-stone-600 dark:text-stone-400 mb-1.5">
                    <span>Serenidade vs Criatividade: {agentTemp}</span>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="1.0"
                    step="0.05"
                    value={agentTemp}
                    onChange={(e) => setAgentTemp(parseFloat(e.target.value))}
                    className="w-full accent-teal-700 cursor-pointer"
                  />
                </div>

                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-2xl bg-teal-700 hover:bg-teal-800 text-white font-medium text-xs shadow-md shadow-teal-700/20 transition flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  <span>Salvar Diretrizes</span>
                </button>
              </form>

              {/* BASE DE ESTUDOS DO AGENTE */}
              {selectedAgent && (
                <AgentKnowledgeManager agent={selectedAgent} onUpdated={loadAllData} />
              )}
            </div>
          </div>
        )}

        {/* ABA 7: GUIA E MANUAL DO ADMINISTRADOR */}
        {activeTab === 'help' && (
          <AdminHelpGuide />
        )}

        {/* MODAL PARA CRIAR AGENTE */}
        <CreateAgentModal
          isOpen={isCreateAgentOpen}
          onClose={() => setIsCreateAgentOpen(false)}
          onSuccess={loadAllData}
        />
      </div>
    </div>
  );
}
