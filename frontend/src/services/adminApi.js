import { supabase } from './supabase';

const BACKEND_URL = (import.meta.env.VITE_BACKEND_URL && import.meta.env.VITE_BACKEND_URL.trim() !== '')
  ? import.meta.env.VITE_BACKEND_URL.replace(/\/$/, '')
  : '';

export async function fetchAdminMetrics() {
  // 1. Tenta via Backend Hermes
  try {
    const res = await fetch(`${BACKEND_URL}/api/admin/metrics`);
    if (res.ok) {
      const ct = res.headers.get('content-type') || '';
      if (ct.includes('application/json')) return await res.json();
    }
  } catch {}

  // 2. Fallback direto ao Supabase (garante exibição das métricas do banco)
  try {
    const [{ count: userCount }, { count: memoryCount }, { count: agentCount }] = await Promise.all([
      supabase.from('izaque_profiles').select('*', { count: 'exact', head: true }),
      supabase.from('izaque_user_memories').select('*', { count: 'exact', head: true }),
      supabase.from('izaque_agents').select('*', { count: 'exact', head: true }),
    ]);

    const { data: mems } = await supabase.from('izaque_user_memories').select('category');
    const categoriesCount = { blocker: 0, goal: 0, belief: 0, pattern: 0 };
    (mems || []).forEach(m => {
      if (categoriesCount[m.category] !== undefined) categoriesCount[m.category]++;
    });

    return {
      totalUsers: userCount || 0,
      totalMemories: memoryCount || 0,
      totalAgents: agentCount || 0,
      categoriesCount,
    };
  } catch (err) {
    console.error('Erro no fallback de métricas Supabase:', err);
    return {
      totalUsers: 0,
      totalMemories: 0,
      totalAgents: 0,
      categoriesCount: { blocker: 0, goal: 0, belief: 0, pattern: 0 },
    };
  }
}

export async function fetchAdminUsers() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/admin/users`);
    if (res.ok) {
      const ct = res.headers.get('content-type') || '';
      if (ct.includes('application/json')) return await res.json();
    }
  } catch {}

  // Fallback direto ao Supabase
  try {
    const { data, error } = await supabase
      .from('izaque_profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch {
    return [];
  }
}

export async function updateRole(userId, role) {
  try {
    const res = await fetch(`${BACKEND_URL}/api/admin/users/role`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, role }),
    });
    if (res.ok) return await res.json();
  } catch {}

  // Fallback direto ao Supabase
  const { error } = await supabase
    .from('izaque_profiles')
    .update({ role, updated_at: new Date().toISOString() })
    .eq('id', userId);

  if (error) throw error;
  return { success: true };
}

export async function fetchAdminMemories() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/admin/memories`);
    if (res.ok) {
      const ct = res.headers.get('content-type') || '';
      if (ct.includes('application/json')) return await res.json();
    }
  } catch {}

  // Fallback direto ao Supabase
  try {
    const { data, error } = await supabase
      .from('izaque_user_memories')
      .select('*, izaque_profiles(full_name, email)')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) throw error;
    return data || [];
  } catch {
    return [];
  }
}

export async function fetchAdminAgents() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/admin/agents`);
    if (res.ok) {
      const ct = res.headers.get('content-type') || '';
      if (ct.includes('application/json')) return await res.json();
    }
  } catch {}

  // Fallback direto ao Supabase
  try {
    const { data, error } = await supabase
      .from('izaque_agents')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch {
    return [];
  }
}

export async function updateAgent(id, data) {
  try {
    const res = await fetch(`${BACKEND_URL}/api/admin/agents/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (res.ok) return await res.json();
  } catch {}

  // Fallback direto ao Supabase
  const { error } = await supabase
    .from('izaque_agents')
    .update(data)
    .eq('id', id);

  if (error) throw error;
  return { success: true };
}

export async function createAgent(data) {
  try {
    const res = await fetch(`${BACKEND_URL}/api/admin/agents`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (res.ok) return await res.json();
  } catch {}

  // Fallback direto ao Supabase
  const { data: created, error } = await supabase
    .from('izaque_agents')
    .insert([data])
    .select()
    .single();

  if (error) throw error;
  return created;
}

export async function deleteAgent(id) {
  try {
    const res = await fetch(`${BACKEND_URL}/api/admin/agents/${id}`, {
      method: 'DELETE',
    });
    if (res.ok) return await res.json();
  } catch {}

  // Fallback direto ao Supabase
  const { error } = await supabase
    .from('izaque_agents')
    .delete()
    .eq('id', id);

  if (error) throw error;
  return { success: true };
}

export async function fetchAgentDocuments(agentId) {
  try {
    const res = await fetch(`${BACKEND_URL}/api/admin/agents/${agentId}/documents`);
    if (res.ok) {
      const ct = res.headers.get('content-type') || '';
      if (ct.includes('application/json')) return await res.json();
    }
  } catch {}

  const { data, error } = await supabase
    .from('izaque_agent_documents')
    .select('*')
    .eq('agent_id', agentId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function uploadAgentDocument(agentId, data) {
  const res = await fetch(`${BACKEND_URL}/api/admin/agents/${agentId}/documents`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Falha ao fazer upload de arquivo de estudo');
  }
  return await res.json();
}

export async function deleteAgentDocument(agentId, docId) {
  try {
    const res = await fetch(`${BACKEND_URL}/api/admin/agents/${agentId}/documents/${docId}`, {
      method: 'DELETE',
    });
    if (res.ok) return await res.json();
  } catch {}

  const { error } = await supabase
    .from('izaque_agent_documents')
    .delete()
    .eq('id', docId);

  if (error) throw error;
  return { success: true };
}

export async function fetchDocumentChunks(agentId, docId) {
  try {
    const res = await fetch(`${BACKEND_URL}/api/admin/agents/${agentId}/documents/${docId}/chunks`);
    if (res.ok) {
      const ct = res.headers.get('content-type') || '';
      if (ct.includes('application/json')) return await res.json();
    }
  } catch {}

  const { data, error } = await supabase
    .from('izaque_agent_knowledge')
    .select('id, content, created_at')
    .eq('document_id', docId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data || [];
}
