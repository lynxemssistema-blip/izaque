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
  getAdminPlans,
  updateAdminPlan,
  updateUserStatus,
  updateUserPlan,
  getAdminSubscriptions,
  approveSubscription,
  getAdminFeedbacks,
} from '../controllers/adminController.js';

const router = Router();

router.get('/admin/metrics', getAdminMetrics);
router.get('/admin/users', getAdminUsers);
router.post('/admin/users/role', updateUserRole);
router.post('/admin/users/status', updateUserStatus);
router.post('/admin/users/plan', updateUserPlan);
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

// Gestão de Planos e Assinaturas (Superadmin)
router.get('/admin/plans', getAdminPlans);
router.put('/admin/plans/:id', updateAdminPlan);
router.get('/admin/subscriptions', getAdminSubscriptions);
router.post('/admin/subscriptions/:id/approve', approveSubscription);
router.get('/admin/feedbacks', getAdminFeedbacks);

export default router;

