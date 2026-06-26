import { create } from 'zustand';
import { dataService, type AppUser } from '../services/dataService';

interface AuthState {
  user: AppUser | null;
  ready: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  init: () => () => void;
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  ready: false,
  signIn: async () => {
    await dataService.signInWithGoogle();
  },
  signOut: async () => {
    await dataService.signOut();
  },
  init: () =>
    dataService.onAuthChange((user) => set({ user, ready: true })),
}));
