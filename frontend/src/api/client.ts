import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('ff_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('ff_token');
      localStorage.removeItem('ff_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;

export const authAPI = {
  login:    (data: any) => api.post('/auth/login', data),
  register: (data: any) => api.post('/auth/register', data),
  me:       ()          => api.get('/auth/me'),
};

export const vehiclesAPI = {
  getAll:       (params?: any)           => api.get('/vehicles', { params }),
  getStats:     ()                       => api.get('/vehicles/stats'),
  getById:      (id: string)             => api.get(`/vehicles/${id}`),
  create:       (data: any)              => api.post('/vehicles', data),
  update:       (id: string, data: any)  => api.patch(`/vehicles/${id}`, data),
  changeStatus: (id: string, status: string) => api.patch(`/vehicles/${id}/status`, { status }),
};

export const driversAPI = {
  getAll:       (params?: any)           => api.get('/drivers', { params }),
  getStats:     ()                       => api.get('/drivers/stats'),
  getById:      (id: string)             => api.get(`/drivers/${id}`),
  create:       (data: any)              => api.post('/drivers', data),
  update:       (id: string, data: any)  => api.patch(`/drivers/${id}`, data),
  changeStatus: (id: string, status: string) => api.patch(`/drivers/${id}/status`, { status }),
};

export const tripsAPI = {
  getAll:   (params?: any)                           => api.get('/trips', { params }),
  getStats: ()                                       => api.get('/trips/stats'),
  getById:  (id: string)                             => api.get(`/trips/${id}`),
  create:   (data: any)                              => api.post('/trips', data),
  advance:  (id: string, status: string, extra: any) => api.patch(`/trips/${id}/status`, { status, ...extra }),
};

export const maintenanceAPI = {
  getAll:   (params?: any)              => api.get('/maintenance', { params }),
  getStats: ()                          => api.get('/maintenance/stats'),
  create:   (data: any)                 => api.post('/maintenance', data),
  close:    (id: string, data: any)     => api.patch(`/maintenance/${id}/close`, data),
};

export const fuelAPI = {
  getAll: (params?: any) => api.get('/fuel', { params }),
  log:    (data: any)    => api.post('/fuel', data),
};

export const reportsAPI = {
  dashboard:      ()                  => api.get('/reports/dashboard'),
  monthly:        (year?: number)     => api.get('/reports/monthly', { params: { year } }),
  vehicleReport:  (vehicleId: string) => api.get(`/reports/vehicle/${vehicleId}`),
};

