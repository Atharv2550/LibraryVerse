import api from './api';

export const issueBook = async ({ copyIdentifier, memberIdentifier, dueDate, notes }) => {
  const res = await api.post('/loans/issue', {
    copyIdentifier,
    memberIdentifier,
    dueDate,
    notes
  });
  return res.data;
};

export const returnBook = async ({ copyIdentifier, loanId, notes }) => {
  const res = await api.post('/loans/return', {
    copyIdentifier,
    loanId,
    notes
  });
  return res.data;
};

export const renewLoan = async (loanId) => {
  const res = await api.post(`/loans/${loanId}/renew`);
  return res.data;
};

export const fetchLoans = async ({ status, memberId, bookId, page = 1, limit = 20 } = {}) => {
  const params = new URLSearchParams();
  if (status) params.append('status', status);
  if (memberId) params.append('memberId', memberId);
  if (bookId) params.append('bookId', bookId);
  params.append('page', page);
  params.append('limit', limit);

  const res = await api.get(`/loans?${params.toString()}`);
  return res.data;
};

export const fetchMyLoans = async (status) => {
  const params = status ? `?status=${status}` : '';
  const res = await api.get(`/loans/my-loans${params}`);
  return res.data;
};

export const fetchOverdueLoans = async () => {
  const res = await api.get('/loans/overdue');
  return res.data;
};

export const fetchLoanById = async (id) => {
  const res = await api.get(`/loans/${id}`);
  return res.data;
};
