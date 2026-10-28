import api from './api';

export const fetchAuditLogs = async ({ action, entityType, actorId, page = 1, limit = 50 } = {}) => {
  const params = new URLSearchParams();
  if (action) params.append('action', action);
  if (entityType) params.append('entityType', entityType);
  if (actorId) params.append('actorId', actorId);
  params.append('page', page);
  params.append('limit', limit);

  const res = await api.get(`/audit?${params.toString()}`);
  return res.data;
};

export const auditService = {
  getAuditLogs: fetchAuditLogs,
  fetchAuditLogs
};

export default auditService;
