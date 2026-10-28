import API from './api';

export const getAdminOverview = async () => {
  const res = await API.get('/admin/overview');
  return res.data;
};

export const getLibrarians = async (status, search) => {
  const params = {};
  if (status && status !== 'all') params.status = status;
  if (search) params.search = search;
  const res = await API.get('/admin/librarians', { params });
  return res.data;
};

export const approveLibrarian = async (id) => {
  const res = await API.put(`/admin/librarians/${id}/approve`);
  return res.data;
};

export const rejectLibrarian = async (id, reason) => {
  const res = await API.put(`/admin/librarians/${id}/reject`, { reason });
  return res.data;
};

export const getUsers = async (params = {}) => {
  const res = await API.get('/admin/users', { params });
  return res.data;
};

export const updateUserStatus = async (id, status) => {
  const res = await API.put(`/admin/users/${id}/status`, { status });
  return res.data;
};

export const getPolicies = async () => {
  const res = await API.get('/admin/policies');
  return res.data;
};

export const updatePolicies = async (policyData) => {
  const res = await API.put('/admin/policies', policyData);
  return res.data;
};
