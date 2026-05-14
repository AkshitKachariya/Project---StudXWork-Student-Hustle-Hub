import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const api = axios.create({ baseURL: API_URL, withCredentials: true });

api.interceptors.request.use((config) => {
  const stored = sessionStorage.getItem('studxwork-auth');
  if (stored) {
    const { state } = JSON.parse(stored);
    if (state?.token) config.headers.Authorization = `Bearer ${state.token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const isLogin = err.config?.url?.includes('/auth/login');
    const isChangePass = err.config?.url?.includes('/auth/change-password');

    if (err.response?.status === 401 && !isLogin && !isChangePass) {
      sessionStorage.removeItem('studxwork-auth');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
