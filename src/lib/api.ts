import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  register: (data: { email: string; password: string; name: string }) =>
    api.post('/api/auth/register', data),
  login: (data: { email: string; password: string }) =>
    api.post('/api/auth/login', data),
  me: () => api.get('/api/auth/me'),
};

// KYC API
export const kycApi = {
  upload: (formData: FormData) =>
    api.post('/api/kyc/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  status: () => api.get('/api/kyc/status'),
};

// Assets API
export const assetsApi = {
  pledge: (data: any) => api.post('/api/assets/pledge', data),
  myAssets: () => api.get('/api/assets/my-assets'),
  mint: (assetId: string, data: any) => api.post(`/api/assets/${assetId}/mint`, data),
};

// Marketplace API
export const marketplaceApi = {
  listings: () => api.get('/api/marketplace/listings'),
  buy: (data: { tokenId: string; amount: number }) =>
    api.post('/api/marketplace/buy', data),
  sell: (data: { tokenId: string; amount: number; price: number }) =>
    api.post('/api/marketplace/sell', data),
};

// Liquidity API
export const liquidityApi = {
  pools: () => api.get('/api/liquidity/pools'),
  add: (data: { poolId: string; amount: number }) =>
    api.post('/api/liquidity/add', data),
  remove: (data: { poolId: string; amount: number }) =>
    api.post('/api/liquidity/remove', data),
};

// Activity API
export const activityApi = {
  myActivity: () => api.get('/api/activity/my-activity'),
};

export default api;