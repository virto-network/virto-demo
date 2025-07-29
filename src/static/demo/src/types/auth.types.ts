import { ReactNode } from 'react';

export interface UserProfile {
  id: string;
  name: string;
  displayName: string;
}

export interface UserMetadata {
  [key: string]: any;
}

export interface User {
  profile: UserProfile;
  metadata: UserMetadata;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  isLoading: boolean;
  error: string | null;
}

export interface LoginFormData {
  username: string;
}

export interface RegisterFormData {
  name: string;
  username: string;
}

export interface SDKConfig {
  federate_server: string;
  provider_url: string;
  config: {
    wallet: string;
  };
}

export interface IAuthService {
  isRegistered(username: string): Promise<boolean>;
  register(user: User): Promise<any>;
  login(username: string): Promise<any>;
  logout(): Promise<void>;
}

export interface DialogState {
  isOpen: boolean;
  currentForm: 'login' | 'register';
  title: string;
}

export interface VirtoConnectProps {
  serverUrl?: string;
  providerUrl?: string;
  onAuthSuccess?: (user: User) => void;
  onAuthError?: (error: string) => void;
}

export interface AuthFormProps {
  onSubmit: (data: LoginFormData | RegisterFormData) => Promise<void>;
  isLoading: boolean;
  error?: string | null;
  onToggleForm: () => void;
}

export interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
} 