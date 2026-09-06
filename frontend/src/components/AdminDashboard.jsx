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
} from 'lucide-react';
import {
  fetchAdminMetrics,
  fetchAdminUsers,
  updateRole,
  fetchAdminMemories,
  fetchAdminAgents,
  updateAgent,
  deleteAgent,
} from '../services/adminApi';
import CreateAgentModal from './CreateAgentModal';
import AgentKnowledgeManager from './AgentKnowledgeManager';
import AdminHelpGuide from './AdminHelpGuide';

export default function AdminDashboard({ currentUser }) {
  const [activeTab, setActiveTab] = useState('metrics');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isCreateAgentOpen, setIsCreateAgentOpen] = useState(false);

  // Dados
  const [metrics, setMetrics] = useState(null);
  const [users, setUsers] = useState([]);
  const [memories, setMemories] = useState([]);
  const [agents, setAgents] = useState([]);

  // Filtros e busca
  const [userSearch, setUserSearch] = useState('');
  const [memoryFilter, setMemoryFilter] = useState('all');
  const [feedbackMsg, setFeedbackMsg] = useState('');

  // Agente em edição
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [agentPrompt, setAgentPrompt] = useState('');
  const [agentTemp, setAgentTemp] = useState(0.7);

  const loadAllData = async () => {
    try {
      setRefreshing(true);
      const [m, u, mem, ag] = await Promise.all([
        fetchAdminMetrics().catch(() => null),
        fetchAdminUsers().catch(() => []),
        fetchAdminMemories().catch(() => []),
        fetchAdminAgents().catch(() => []),
      ]);

      setMetrics(m);
      setUsers(u);
      setMemories(mem);
      setAgents(ag);

      if (ag.length > 0 && !selectedAgent) {
        setSelectedAgent(ag[0]);
        setAgentPrompt(ag[0].system_prompt);
        setAgentTemp(Number(ag[0].temperature) || 0.7);
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
              Acompanhamento de usuários, histórico de reflexões e especialização de mentores
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

        {/* CARTÕES DE MÉTRICAS NO ESTILO DO SANTUÁRIO */}
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
              Refúgios ativos
            </span>
          </div>

          <div className="p-3.5 sm:p-6 rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-800/80 border border-stone-200/80 dark:border-slate-700 shadow-sm">
            <div className="flex items-center justify-between text-stone-500 dark:text-stone-400 mb-1.5 sm:mb-2">
              <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider">Lembranças</span>
              <Heart className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-700 dark:text-amber-400" />
            </div>
            <span className="text-xl sm:text-3xl font-serif font-medium text-stone-900 dark:text-stone-50">
              {metrics?.totalMemories ?? '...'}
            </span>
            <span className="block text-[10px] sm:text-[11px] text-teal-800 dark:text-teal-400 mt-0.5 sm:mt-1 font-serif">
              Bloqueios gravados
            </span>
          </div>

          <div className="p-3.5 sm:p-6 rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-800/80 border border-stone-200/80 dark:border-slate-700 shadow-sm">
            <div className="flex items-center justify-between text-stone-500 dark:text-stone-400 mb-1.5 sm:mb-2">
              <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider">Mentores</span>
              <Compass className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-teal-800 dark:text-teal-400" />
            </div>
            <span className="text-xl sm:text-3xl font-serif font-medium text-stone-900 dark:text-stone-50">
              {metrics?.totalAgents ?? '...'}
            </span>
            <span className="block text-[10px] sm:text-[11px] text-stone-400 dark:text-stone-500 mt-0.5 sm:mt-1">
              Izaque & Especialistas
            </span>
          </div>

          <div className="p-3.5 sm:p-6 rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-800/80 border border-stone-200/80 dark:border-slate-700 shadow-sm">
            <div className="flex items-center justify-between text-stone-500 dark:text-stone-400 mb-1.5 sm:mb-2">
              <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider">Status</span>
              <Feather className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-teal-700 dark:text-teal-400" />
            </div>
            <span className="text-xs sm:text-base font-serif font-medium text-teal-800 dark:text-teal-300 flex items-center gap-1.5 sm:gap-2">
              <span className="w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full bg-teal-600 dark:bg-teal-400 animate-pulse" />
              Sessões Ativas
            </span>
            <span className="block text-[10px] sm:text-[11px] text-stone-400 dark:text-stone-500 mt-0.5 sm:mt-1">
              Escuta disponível
            </span>
          </div>
        </div>

        {/* NAVEGAÇÃO DE ABAS RESPONSIVA COM SWIPE NO MOBILE */}
        <div className="flex overflow-x-auto pb-1 max-w-full -mx-2 px-2 sm:mx-0 sm:px-0 no-scrollbar">
          <div className="inline-flex p-1.5 rounded-2xl bg-stone-200/60 dark:bg-slate-800/60 border border-stone-300/50 dark:border-slate-700/50 text-xs font-medium whitespace-nowrap shrink-0">
            <button
              onClick={() => setActiveTab('users')}
              className={`px-3 sm:px-4 py-2 rounded-xl transition flex items-center gap-2 ${
                activeTab === 'users'
                  ? 'bg-teal-700 text-white shadow-sm'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              Usuários ({users.length})
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
              <span>Manual de Ajuda</span>
            </button>
          </div>
        </div>

        {/* ABA 1: GERENCIAR USUÁRIOS */}
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
                    <th className="p-4">Nome & E-mail</th>
                    <th className="p-4">Papel na Mentoria</th>
                    <th className="p-4">Data de Entrada</th>
                    <th className="p-4 text-right">Alterar Papel</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200/60 dark:divide-slate-700/60">
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-stone-50/70 dark:hover:bg-slate-750 transition">
                      <td className="p-4">
                        <div className="font-serif font-medium text-stone-900 dark:text-stone-100 text-sm">
                          {u.full_name || 'Sem nome'}
                        </div>
                        <div className="text-[11px] text-stone-400">{u.email}</div>
                      </td>
                      <td className="p-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-serif ${
                            u.role === 'master'
                              ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200'
                              : u.role === 'admin'
                              ? 'bg-teal-50 dark:bg-teal-950/40 text-teal-800 dark:text-teal-300 border border-teal-200'
                              : 'bg-stone-100 dark:bg-slate-700 text-stone-600 dark:text-stone-300'
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="p-4 text-stone-400">
                        {new Date(u.created_at).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="p-4 text-right">
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
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ABA 2: LEMBRANÇAS DE SESSÕES */}
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
                    className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-800/80 border border-stone-200/80 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] uppercase font-serif px-2 py-0.5 rounded-full bg-teal-50 dark:bg-teal-950/40 text-teal-800 dark:text-teal-300 border border-teal-200">
                          {m.category}
                        </span>
                        <span className="text-xs text-amber-700 dark:text-amber-400 font-medium">
                          Importância: {m.importance_score}/5
                        </span>
                        <span className="text-xs text-stone-400">
                          • {new Date(m.created_at).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                      <p className="text-sm font-serif text-stone-800 dark:text-stone-200">{m.content}</p>
                    </div>

                    <div className="text-[11px] text-stone-400 font-mono">
                      Viajante: {m.user_id.slice(0, 8)}...
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ABA 3: MENTORES & BASE DE ESTUDOS */}
        {activeTab === 'agents' && (
          <div className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-1 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-teal-800 dark:text-teal-400">
                  Mentores Ativos
                </h3>
                <button
                  onClick={() => setIsCreateAgentOpen(true)}
                  className="px-3 py-1.5 rounded-2xl bg-teal-700 hover:bg-teal-800 text-white text-[11px] font-medium transition flex items-center gap-1.5 shadow-sm"
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
                  className={`p-4 rounded-3xl border cursor-pointer transition flex items-center justify-between gap-2 ${
                    selectedAgent?.id === ag.id
                      ? 'bg-teal-50 dark:bg-teal-950/40 border-teal-700 text-stone-900 dark:text-stone-100 shadow-sm'
                      : 'bg-white dark:bg-slate-800 border-stone-200 dark:border-slate-700 text-stone-700 dark:text-stone-300 hover:border-teal-600'
                  }`}
                >
                  <div>
                    <div className="font-serif font-medium text-sm flex items-center gap-2">
                      {ag.name}
                      <span className="text-[10px] uppercase font-sans px-1.5 py-0.2 rounded bg-stone-100 dark:bg-slate-700 text-stone-500">
                        {ag.type}
                      </span>
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

        {/* ABA 4: GUIA E MANUAL DO ADMINISTRADOR */}
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
