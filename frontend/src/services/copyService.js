import api from './api';

export const fetchCopiesByBook = async (bookId) => {
  const res = await api.get(`/copies/book/${bookId}`);
  return res.data;
};

export const fetchCopyByCode = async (code) => {
  const res = await api.get(`/copies/lookup/${encodeURIComponent(code)}`);
  return res.data;
};

export const fetchAllCopies = async ({ status, condition, search, page = 1, limit = 20 } = {}) => {
  const params = new URLSearchParams();
  if (status) params.append('status', status);
  if (condition) params.append('condition', condition);
  if (search) params.append('search', search);
  params.append('page', page);
  params.append('limit', limit);

  const res = await api.get(`/copies?${params.toString()}`);
  return res.data;
};

export const createCopy = async (copyData) => {
  const res = await api.post('/copies', copyData);
  return res.data;
};

export const bulkCreateCopies = async ({ bookId, count, shelfLocation, condition, price }) => {
  const res = await api.post('/copies/bulk', {
    bookId,
    count,
    shelfLocation,
    condition,
    price
  });
  return res.data;
};

export const updateCopy = async (id, copyData) => {
  const res = await api.put(`/copies/${id}`, copyData);
  return res.data;
};

export const deleteCopy = async (id) => {
  const res = await api.delete(`/copies/${id}`);
  return res.data;
};
