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
  getAdminCreator,
  updateAdminCreator,
  generateBroadcastDraftController,
  getBroadcastStatsController,
  sendBroadcastMessageController,
  getPublicGuidedConversations,
  getAdminGuidedConversations,
  createAdminGuidedConversation,
  updateAdminGuidedConversation,
  deleteAdminGuidedConversation,
  getAdminUserGroups,
  createAdminUserGroup,
  updateAdminUserGroup,
  deleteAdminUserGroup,
  getAdminGroupMembers,
  getUserAssignedGroups,
  setUserAssignedGroups,
  sendGroupBroadcast,
  getAdminGroupBroadcasts,
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from '../controllers/adminController.js';

const router = Router();

// Conversas Direcionadas Públicas (para todos os usuários)
router.get('/guided-conversations', getPublicGuidedConversations);

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

// Gestão do Perfil do Idealizador (Superadmin)
router.get('/admin/creator', getAdminCreator);
router.put('/admin/creator', updateAdminCreator);

// Comunicação & E-mails em Massa (Superadmin)
router.post('/admin/broadcast/draft', generateBroadcastDraftController);
router.get('/admin/broadcast/stats', getBroadcastStatsController);
router.post('/admin/broadcast/send', sendBroadcastMessageController);

// Gestão de Conversas Direcionadas & Roteiro de Perguntas (Superadmin)
router.get('/admin/guided-conversations', getAdminGuidedConversations);
router.post('/admin/guided-conversations', createAdminGuidedConversation);
router.put('/admin/guided-conversations/:id', updateAdminGuidedConversation);
router.delete('/admin/guided-conversations/:id', deleteAdminGuidedConversation);

// Gestão de Grupos de Usuários & Classificação N:N (Superadmin)
router.get('/admin/user-groups', getAdminUserGroups);
router.post('/admin/user-groups', createAdminUserGroup);
router.put('/admin/user-groups/:id', updateAdminUserGroup);
router.delete('/admin/user-groups/:id', deleteAdminUserGroup);
router.get('/admin/user-groups/:id/members', getAdminGroupMembers);
router.get('/admin/users/:userId/groups', getUserAssignedGroups);
router.post('/admin/users/:userId/groups', setUserAssignedGroups);

// Disparos de Texto e Áudio por Grupo (Superadmin)
router.post('/admin/group-broadcasts', sendGroupBroadcast);
router.get('/admin/group-broadcasts', getAdminGroupBroadcasts);

// Notificações / Comunicados In-App do Usuário
router.get('/user/notifications/:userId', getUserNotifications);
router.patch('/user/notifications/:id/read', markNotificationAsRead);
router.patch('/user/notifications/read-all/:userId', markAllNotificationsAsRead);

export default router;



