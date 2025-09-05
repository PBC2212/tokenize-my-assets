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
  submit: (formData: FormData) =>
    api.post('/api/kyc/submit', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  upload: (formData: FormData) =>
    api.post('/api/kyc/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  status: () => api.get('/api/kyc/status'),
};

// Assets API
export const assetsApi = {
  pledge: (data: any) => api.post('/api/assets/pledge', data),
  mine: () => api.get('/api/assets/mine'),
  pledged: () => api.get('/api/assets/pledged'),
  myAssets: () => api.get('/api/assets/my-assets'),
  marketplace: () => api.get('/api/assets/marketplace'),
  mint: (assetId: string, data: any) => api.post(`/api/assets/${assetId}/mint`, data),
};

// Marketplace API
export const marketplaceApi = {
  listings: () => api.get('/api/marketplace/listings'),
  buy: (data: { tokenId: string; amount: number }) =>
    api.post('/api/marketplace/buy', data),
  buyWithId: (tokenId: string, data: { amount: number }) =>
    api.post(`/api/marketplace/buy/${tokenId}`, data),
  sell: (data: { tokenId: string; amount: number; price: number }) =>
    api.post('/api/marketplace/sell', data),
  sellWithId: (tokenId: string, data: { amount: number; price: number }) =>
    api.post(`/api/marketplace/sell/${tokenId}`, data),
};

// Liquidity API
export const liquidityApi = {
  pools: () => api.get('/api/liquidity/pools'),
  provide: (data: { poolId: string; amount: number }) =>
    api.post('/api/liquidity/provide', data),
  add: (data: { poolId: string; amount: number }) =>
    api.post('/api/liquidity/add', data),
  withdraw: (data: { poolId: string; amount: number }) =>
    api.post('/api/liquidity/withdraw', data),
  remove: (data: { poolId: string; amount: number }) =>
    api.post('/api/liquidity/remove', data),
};

// Activity API
export const activityApi = {
  mine: () => api.get('/api/activity/mine'),
  myActivity: () => api.get('/api/activity/my-activity'),
};

// Health API
export const healthApi = {
  check: () => api.get('/api/health'),
};

export default api;