import { create } from 'zustand';
import type { User } from '@/types';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  setUser: (user: User) => void;
  logout: () => void;
  hydrate: () => void;
};

export const useAuthStore = create<AuthState>( (set) => ({
  user: null,
  isAuthenticated: false,

  setUser: (user) => set( {user, isAuthenticated: true}),

  logout: () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    set({user: null, isAuthenticated: false });
  },

  hydrate: () => {
    const userStr = localStorage.getItem('user');
    const token = localStorage.getItem('accessToken');
    if( userStr && token ) {
      set({ user: JSON.parse(userStr), isAuthenticated: true });
    }
  },
}));