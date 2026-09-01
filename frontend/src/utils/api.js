import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : '/api',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('autoloc_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const msg = error.response?.data?.error || 'Erreur serveur';
    if (error.response?.status === 401) {
      localStorage.removeItem('autoloc_token');
      localStorage.removeItem('autoloc_user');
      window.location.href = '/login';
    }
    return Promise.reject(new Error(msg));
  }
);

export default api;

// Typed API helpers
export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  me: () => api.get('/auth/me'),
};

export const carsAPI = {
  getAll: (params) => api.get('/cars', { params }),
  getOne: (id) => api.get(`/cars/${id}`),
  getStats: () => api.get('/cars/stats'),
  create: (data) => api.post('/cars', data),
  update: (id, data) => api.put(`/cars/${id}`, data),
  delete: (id) => api.delete(`/cars/${id}`),
  uploadPhoto: (id, file) => {
    const fd = new FormData();
    fd.append('photo', file);
    return api.post(`/cars/${id}/photo`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
  getPhotos: (id) => api.get(`/cars/${id}/photos`),
  addPhoto: (id, file) => {
    const fd = new FormData();
    fd.append('photo', file);
    return api.post(`/cars/${id}/photos`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
  deletePhoto: (carId, photoId) => api.delete(`/cars/${carId}/photos/${photoId}`),
  setPrimary: (carId, photoId) => api.put(`/cars/${carId}/photos/${photoId}/primary`),
};

export const clientsAPI = {
  getAll: (params) => api.get('/clients', { params }),
  getOne: (id) => api.get(`/clients/${id}`),
  create: (data) => api.post('/clients', data),
  update: (id, data) => api.put(`/clients/${id}`, data),
  delete: (id) => api.delete(`/clients/${id}`),
};

export const reservationsAPI = {
  getAll: (params) => api.get('/reservations', { params }),
  getOne: (id) => api.get(`/reservations/${id}`),
  create: (data) => api.post('/reservations', data),
  update: (id, data) => api.put(`/reservations/${id}`, data),
  delete: (id) => api.delete(`/reservations/${id}`),
  checkAvailability: (params) => api.get('/reservations/availability', { params }),
};

export const contractsAPI = {
  getAll: () => api.get('/contracts'),
  create: (data) => api.post('/contracts', data),
  close: (id, data) => api.put(`/contracts/${id}/close`, data),
  downloadPdf: async (id, contractNumber) => {
    const token = localStorage.getItem('autoloc_token');
    const base = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : '/api';
    const response = await fetch(`${base}/contracts/${id}/pdf`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!response.ok) throw new Error('Impossible de générer le PDF');
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${contractNumber || 'contrat'}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  },
};

export const invoicesAPI = {
  getAll: (params) => api.get('/invoices', { params }),
  create: (data) => api.post('/invoices', data),
  update: (id, data) => api.put(`/invoices/${id}`, data),
};

export const paymentsAPI = {
  getAll: () => api.get('/payments'),
  create: (data) => api.post('/payments', data),
};

export const maintenanceAPI = {
  getAll: (params) => api.get('/maintenance', { params }),
  create: (data) => api.post('/maintenance', data),
  update: (id, data) => api.put(`/maintenance/${id}`, data),
};

export const dashboardAPI = {
  getStats: () => api.get('/dashboard/stats'),
  getRevenue: (params) => api.get('/reports/revenue', { params }),
};
