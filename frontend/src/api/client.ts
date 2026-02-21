import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: { 'Content-Type': 'application/json' },
});

// Attach token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('ff_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 globally — redirect to login
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

// ── Auth ────────────────────────────────────────────────────────────────
export const authAPI = {
  login:    (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  me:       ()     => api.get('/auth/me'),
};

// ── Vehicles ────────────────────────────────────────────────────────────
export const vehiclesAPI = {
  getAll:       (params) => api.get('/vehicles', { params }),
  getStats:     ()       => api.get('/vehicles/stats'),
  getById:      (id)     => api.get(`/vehicles/${id}`),
  create:       (data)   => api.post('/vehicles', data),
  update:       (id, data) => api.patch(`/vehicles/${id}`, data),
  changeStatus: (id, status) => api.patch(`/vehicles/${id}/status`, { status }),
};

// ── Drivers ────────────────────────────────────────────────────────────
export const driversAPI = {
  getAll:       (params) => api.get('/drivers', { params }),
  getStats:     ()       => api.get('/drivers/stats'),
  getById:      (id)     => api.get(`/drivers/${id}`),
  create:       (data)   => api.post('/drivers', data),
  update:       (id, data) => api.patch(`/drivers/${id}`, data),
  changeStatus: (id, status) => api.patch(`/drivers/${id}/status`, { status }),
};

// ── Trips ───────────────────────────────────────────────────────────────
export const tripsAPI = {
  getAll:     (params) => api.get('/trips', { params }),
  getStats:   ()       => api.get('/trips/stats'),
  getById:    (id)     => api.get(`/trips/${id}`),
  create:     (data)   => api.post('/trips', data),
  advance:    (id, status, extra) => api.patch(`/trips/${id}/status`, { status, ...extra }),
};

// ── Maintenance ─────────────────────────────────────────────────────────
export const maintenanceAPI = {
  getAll:  (params) => api.get('/maintenance', { params }),
  getStats: ()      => api.get('/maintenance/stats'),
  create:  (data)   => api.post('/maintenance', data),
  close:   (id, data) => api.patch(`/maintenance/${id}/close`, data),
};

// ── Fuel ────────────────────────────────────────────────────────────────
export const fuelAPI = {
  getAll: (params) => api.get('/fuel', { params }),
  log:    (data)   => api.post('/fuel', data),
};

// ── Reports ─────────────────────────────────────────────────────────────
export const reportsAPI = {
  dashboard:      ()         => api.get('/reports/dashboard'),
  monthly:        (year)     => api.get('/reports/monthly', { params: { year } }),
  vehicleReport:  (vehicleId) => api.get(`/reports/vehicle/${vehicleId}`),
};
