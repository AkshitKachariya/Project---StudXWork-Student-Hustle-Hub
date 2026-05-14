import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import api from '../utils/api';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      loading: false,

      register: async (data) => {
        set({ loading: true });
        try {
          const res = await api.post('/auth/register', data);
          return res.data;
        } finally {
          set({ loading: false });
        }
      },

      verifyOtp: async (userId, otp) => {
        set({ loading: true });
        try {
          const res = await api.post('/auth/verify-otp', { userId, otp });
          set({ user: res.data.user, token: res.data.token, isAuthenticated: true });
          return res.data;
        } finally {
          set({ loading: false });
        }
      },

      login: async (data) => {
        set({ loading: true });
        try {
          const res = await api.post('/auth/login', data);
          set({ user: res.data.user, token: res.data.token, isAuthenticated: true });
          return res.data;
        } finally {
          set({ loading: false });
        }
      },

      logout: async () => {
        try {
          await api.get('/auth/logout');
        } catch (error) {
          console.error("Logout error", error);
        }
        set({ user: null, token: null, isAuthenticated: false });
        // Clear session storage explicitly just in case
        sessionStorage.removeItem('studxwork-auth');
      },

      fetchUser: async () => {
        try {
          const res = await api.get('/profile/me');
          set({ user: res.data.data });
          return res.data.data;
        } catch (error) {
          console.error("Fetch user error", error);
        }
      },

      updateUser: (userData) => {
        set((state) => ({
          user: { ...state.user, ...userData }
        }));
      },

      counters: null,
      fetchCounters: async () => {
        try {
          const res = await api.get('/stats');
          set({ counters: res.data.data || null });
        } catch (error) {
          console.error("Fetch counters error", error);
        }
      },

      initAxios: () => {
        // Token is handled by api interceptor
      }
    }),
    { 
      name: 'studxwork-auth', 
      storage: createJSONStorage(() => sessionStorage),
      partialize: (s) => ({ user: s.user, token: s.token, isAuthenticated: s.isAuthenticated }) 
    }
  )
);
