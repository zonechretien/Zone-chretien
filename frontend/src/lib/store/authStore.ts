// src/lib/store/authStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authAPI } from '../api';

export interface User {
  id: string;
  email: string;
  nom: string;
  prenom: string;
  role: 'SUPER_ADMIN' | 'EDITEUR' | 'CONTRIBUTEUR' | 'MODERATEUR';
  avatar?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  setTokens: (token: string, refreshToken: string) => void;
  fetchMe: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      refreshToken: null,
      isLoading: false,

      login: async (email, password) => {
        set({ isLoading: true });
        try {
          const { data } = await authAPI.login(email, password);
          localStorage.setItem('glorysound_token', data.accessToken);
          localStorage.setItem('glorysound_refresh', data.refreshToken);
          set({ user: data.user, token: data.accessToken, refreshToken: data.refreshToken, isLoading: false });
        } catch (err) {
          set({ isLoading: false });
          throw err;
        }
      },

      logout: async () => {
        try { await authAPI.logout(); } catch { /* ignore */ }
        localStorage.removeItem('glorysound_token');
        localStorage.removeItem('glorysound_refresh');
        set({ user: null, token: null, refreshToken: null });
      },

      setTokens: (token, refreshToken) => {
        localStorage.setItem('glorysound_token', token);
        localStorage.setItem('glorysound_refresh', refreshToken);
        set({ token, refreshToken });
      },

      fetchMe: async () => {
        try {
          const { data } = await authAPI.me();
          set({ user: data.user });
        } catch {
          set({ user: null, token: null });
        }
      },
    }),
    {
      name: 'glorysound-auth',
      partialize: (state) => ({ user: state.user, token: state.token, refreshToken: state.refreshToken }),
    }
  )
);

// Role helpers
export const canPublish = (role?: string) =>
  role === 'SUPER_ADMIN' || role === 'EDITEUR';

export const canModerate = (role?: string) =>
  role === 'SUPER_ADMIN' || role === 'EDITEUR' || role === 'MODERATEUR';

export const isAdmin = (role?: string) => role === 'SUPER_ADMIN';
