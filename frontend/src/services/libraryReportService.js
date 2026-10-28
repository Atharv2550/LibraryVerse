import api from './api';

export const fetchLibraryAnalytics = async () => {
  const res = await api.get('/library-reports/analytics');
  return res.data;
};

export const downloadReportCsv = async (type = 'loans', { fromDate, toDate } = {}) => {
  const params = new URLSearchParams();
  if (type) params.append('type', type);
  if (fromDate) params.append('fromDate', fromDate);
  if (toDate) params.append('toDate', toDate);

  const res = await api.get(`/library-reports/export?${params.toString()}`, {
    responseType: 'blob'
  });

  const blob = new Blob([res.data], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `library-${type}-${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
};

export const libraryReportService = {
  getAnalyticsOverview: fetchLibraryAnalytics,
  fetchLibraryAnalytics,
  exportReportCsv: downloadReportCsv,
  downloadReportCsv
};

export default libraryReportService;
