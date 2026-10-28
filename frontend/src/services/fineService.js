import api from './api';

export const fetchFines = async ({ status, memberId, reason, page = 1, limit = 20 } = {}) => {
  const params = new URLSearchParams();
  if (status) params.append('status', status);
  if (memberId) params.append('memberId', memberId);
  if (reason) params.append('reason', reason);
  params.append('page', page);
  params.append('limit', limit);

  const res = await api.get(`/fines?${params.toString()}`);
  return res.data;
};

export const fetchMyFines = async () => {
  const res = await api.get('/fines/my');
  return res.data;
};

export const recordFinePayment = async (id, { paymentMethod, transactionReference, notes }) => {
  const res = await api.post(`/fines/${id}/pay`, {
    paymentMethod,
    transactionReference,
    notes
  });
  return res.data;
};

export const waiveFine = async (id, { waiverReason }) => {
  const res = await api.post(`/fines/${id}/waive`, { waiverReason });
  return res.data;
};

export const assessManualFine = async ({ memberId, amount, reason, notes }) => {
  const res = await api.post('/fines/manual', {
    memberId,
    amount,
    reason,
    notes
  });
  return res.data;
};

export const fineService = {
  getFines: fetchFines,
  fetchFines,
  fetchMyFines,
  recordPayment: (id, data) => recordFinePayment(id, { paymentMethod: data.paymentMethod, notes: data.transactionNote }),
  recordFinePayment,
  waiveFine: (id, waiverReason) => waiveFine(id, { waiverReason: typeof waiverReason === 'string' ? waiverReason : waiverReason?.waiverReason }),
  assessPenalty: (data) => assessManualFine({ memberId: data.memberId, amount: data.amount, reason: data.reason, notes: data.notes }),
  assessManualFine
};

export default fineService;
