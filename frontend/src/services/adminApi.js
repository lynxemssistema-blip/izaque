const BACKEND_URL = (import.meta.env.VITE_BACKEND_URL !== undefined && import.meta.env.VITE_BACKEND_URL !== '')
  ? import.meta.env.VITE_BACKEND_URL
  : (import.meta.env.PROD ? '' : 'http://localhost:3001');

export async function fetchAdminMetrics() {
  const res = await fetch(`${BACKEND_URL}/api/admin/metrics`);
  if (!res.ok) throw new Error('Falha ao carregar métricas');
  return await res.json();
}

export async function fetchAdminUsers() {
  const res = await fetch(`${BACKEND_URL}/api/admin/users`);
  if (!res.ok) throw new Error('Falha ao carregar usuários');
  return await res.json();
}

export async function updateRole(userId, role) {
  const res = await fetch(`${BACKEND_URL}/api/admin/users/role`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, role }),
  });
  if (!res.ok) throw new Error('Falha ao atualizar papel do usuário');
  return await res.json();
}

export async function fetchAdminMemories() {
  const res = await fetch(`${BACKEND_URL}/api/admin/memories`);
  if (!res.ok) throw new Error('Falha ao carregar memórias');
  return await res.json();
}

export async function fetchAdminAgents() {
  const res = await fetch(`${BACKEND_URL}/api/admin/agents`);
  if (!res.ok) throw new Error('Falha ao carregar agentes');
  return await res.json();
}

export async function updateAgent(id, data) {
  const res = await fetch(`${BACKEND_URL}/api/admin/agents/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Falha ao atualizar mentor');
  return await res.json();
}

export async function createAgent(data) {
  const res = await fetch(`${BACKEND_URL}/api/admin/agents`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Falha ao criar novo mentor especialista');
  }
  return await res.json();
}

export async function deleteAgent(id) {
  const res = await fetch(`${BACKEND_URL}/api/admin/agents/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Falha ao remover agente');
  }
  return await res.json();
}

export async function fetchAgentDocuments(agentId) {
  const res = await fetch(`${BACKEND_URL}/api/admin/agents/${agentId}/documents`);
  if (!res.ok) throw new Error('Falha ao carregar documentos do agente');
  return await res.json();
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
  const res = await fetch(`${BACKEND_URL}/api/admin/agents/${agentId}/documents/${docId}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Falha ao remover documento de estudo');
  return await res.json();
}

export async function fetchDocumentChunks(agentId, docId) {
  const res = await fetch(`${BACKEND_URL}/api/admin/agents/${agentId}/documents/${docId}/chunks`);
  if (!res.ok) throw new Error('Falha ao carregar trechos do documento');
  return await res.json();
}
