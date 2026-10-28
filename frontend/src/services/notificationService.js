import API from './api';

export const fetchNotifications = async (page = 1, limit = 20) => {
  const res = await API.get(`/notifications?page=${page}&limit=${limit}`);
  return res.data;
};

export const fetchUnreadCount = async () => {
  const res = await API.get('/notifications/unread-count');
  return res.data;
};

export const markAsRead = async (id) => {
  const res = await API.patch(`/notifications/${id}/read`);
  return res.data;
};

export const markAllAsRead = async () => {
  const res = await API.patch('/notifications/read-all');
  return res.data;
};

export const deleteNotification = async (id) => {
  const res = await API.delete(`/notifications/${id}`);
  return res.data;
};
