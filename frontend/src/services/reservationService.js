import api from './api';

export const createReservation = async (bookId) => {
  const res = await api.post('/reservations', { bookId });
  return res.data;
};

export const cancelReservation = async (id) => {
  const res = await api.post(`/reservations/${id}/cancel`);
  return res.data;
};

export const fetchMyReservations = async () => {
  const res = await api.get('/reservations/my');
  return res.data;
};

export const fetchReservations = async ({ status, bookId, page = 1, limit = 20 } = {}) => {
  const params = new URLSearchParams();
  if (status) params.append('status', status);
  if (bookId) params.append('bookId', bookId);
  params.append('page', page);
  params.append('limit', limit);

  const res = await api.get(`/reservations?${params.toString()}`);
  return res.data;
};
