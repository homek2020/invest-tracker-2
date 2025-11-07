import create from 'zustand';

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  email: string;
  setTokens: (accessToken: string, refreshToken: string) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  refreshToken: null,
  email: 'demo@example.com',
  setTokens: (accessToken, refreshToken) => set({ accessToken, refreshToken }),
}));
