import { Router } from 'express';
import {
  getAdminMetrics,
  getAdminUsers,
  updateUserRole,
  getAdminMemories,
  getAdminAgents,
  updateAdminAgent,
  createAdminAgent,
  deleteAdminAgent,
  uploadAgentDocument,
  getAgentDocuments,
  deleteAgentDocument,
  getAgentDocumentChunks,
} from '../controllers/adminController.js';

const router = Router();

router.get('/admin/metrics', getAdminMetrics);
router.get('/admin/users', getAdminUsers);
router.post('/admin/users/role', updateUserRole);
router.get('/admin/memories', getAdminMemories);
router.get('/admin/agents', getAdminAgents);
router.post('/admin/agents', createAdminAgent);
router.put('/admin/agents/:id', updateAdminAgent);
router.delete('/admin/agents/:id', deleteAdminAgent);

// Documentos e Base de Conhecimento dos Agentes (Estudo)
router.get('/admin/agents/:id/documents', getAgentDocuments);
router.post('/admin/agents/:id/documents', uploadAgentDocument);
router.delete('/admin/agents/:id/documents/:docId', deleteAgentDocument);
router.get('/admin/agents/:id/documents/:docId/chunks', getAgentDocumentChunks);

export default router;
