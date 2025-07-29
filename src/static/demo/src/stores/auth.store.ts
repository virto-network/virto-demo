import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { AuthState, User, LoginFormData, RegisterFormData } from '@/types/auth.types';
import { AuthService } from '@/services/auth.service';
import { ERROR_MESSAGES } from '@/constants/config';

interface AuthStore extends AuthState {
  login: (data: LoginFormData) => Promise<void>;
  register: (data: RegisterFormData) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: User | null) => void;
  setError: (error: string | null) => void;
  setLoading: (loading: boolean) => void;
  clearError: () => void;
  
  authService: AuthService | null;
  initializeAuthService: (serverUrl?: string, providerUrl?: string) => void;
}

export const useAuthStore = create<AuthStore>()(
  devtools(
    (set, get) => ({
      isAuthenticated: false,
      user: null,
      isLoading: false,
      error: null,
      authService: null,

      initializeAuthService: (serverUrl?: string, providerUrl?: string) => {
        const authService = new AuthService({
          federate_server: serverUrl,
          provider_url: providerUrl,
        });
        
        try {
          authService.initializeSDK();
          set({ authService });
        } catch (error) {
          console.error('Failed to initialize auth service:', error);
          set({ error: ERROR_MESSAGES.SDK_INITIALIZATION_FAILED });
        }
      },

      login: async (data: LoginFormData) => {
        const { authService } = get();
        if (!authService) {
          set({ error: 'Auth service not initialized' });
          return;
        }

        set({ isLoading: true, error: null });

        try {
          const result = await authService.login(data.username);
          console.log('Login successful:', result);
          const user: User = {
            profile: {
              id: data.username,
              name: data.username,
              displayName: data.username,
            },
            metadata: {},
          };

          set({
            isAuthenticated: true,
            user,
            isLoading: false,
            error: null,
          });
        } catch (error) {
          console.error('Login failed:', error);
          set({
            isAuthenticated: false,
            user: null,
            isLoading: false,
            error: ERROR_MESSAGES.LOGIN_FAILED,
          });
        }
      },

      register: async (data: RegisterFormData) => {
        const { authService } = get();
        if (!authService) {
          set({ error: 'Auth service not initialized' });
          return;
        }

        set({ isLoading: true, error: null });

        try {
          const isRegistered = await authService.isRegistered(data.username);
          
          if (isRegistered) {
            set({
              isLoading: false,
              error: ERROR_MESSAGES.USER_ALREADY_REGISTERED,
            });
            return;
          }

          const user: User = {
            profile: {
              id: data.username,
              name: data.name,
              displayName: data.username,
            },
            metadata: {},
          };

          await authService.register(user);

          set({
            isLoading: false,
            error: null,
          });
        } catch (error) {
          console.error('Registration failed:', error);
          set({
            isLoading: false,
            error: ERROR_MESSAGES.REGISTRATION_FAILED,
          });
        }
      },

      logout: async () => {
        const { authService } = get();
        if (!authService) return;

        try {
          await authService.logout();
          set({
            isAuthenticated: false,
            user: null,
            error: null,
          });
        } catch (error) {
          console.error('Logout failed:', error);
        }
      },

      setUser: (user: User | null) => {
        set({ user, isAuthenticated: !!user });
      },

      setError: (error: string | null) => {
        set({ error });
      },

      setLoading: (isLoading: boolean) => {
        set({ isLoading });
      },

      clearError: () => {
        set({ error: null });
      },
    }),
    {
      name: 'auth-store',
    }
  )
); 