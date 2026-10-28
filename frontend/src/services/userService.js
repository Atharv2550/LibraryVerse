import API from './api';

export const getUserProfile = async () => {
  const response = await API.get('/users/profile');
  return response.data;
};

export const updateUserProfile = async (profileData) => {
  const response = await API.put('/users/profile', profileData);
  return response.data;
};


// Librarian / Admin: Member Management
export const fetchMembers = async ({ search, status, role, page = 1, limit = 20 } = {}) => {
  const params = new URLSearchParams();
  if (search) params.append('search', search);
  if (status) params.append('status', status);
  if (role) params.append('role', role);
  params.append('page', page);
  params.append('limit', limit);

  const response = await API.get(`/users/members?${params.toString()}`);
  return response.data;
};

export const fetchMemberById = async (id) => {
  const response = await API.get(`/users/members/${id}`);
  return response.data;
};

export const createMember = async (memberData) => {
  const response = await API.post('/users/members', memberData);
  return response.data;
};

export const updateMembership = async (id, membershipData) => {
  const response = await API.put(`/users/members/${id}/membership`, membershipData);
  return response.data;
};

export const updateUserRole = async (id, role) => {
  const response = await API.put(`/users/members/${id}/role`, { role });
  return response.data;
};

