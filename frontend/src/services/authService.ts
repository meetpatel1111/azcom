import { apiClient, handleApiError } from './api';
import { User, AuthTokens, LoginForm, RegisterForm } from '../types';
import { AxiosError } from 'axios';

interface LoginResponse {
  message: string;
  user: User;
  tokens: AuthTokens;
}

interface RegisterResponse {
  message: string;
  user: User;
  tokens: AuthTokens;
}

interface CurrentUserResponse {
  user: User;
}

export const login = async (credentials: LoginForm): Promise<LoginResponse> => {
  try {
    return await apiClient.post<LoginResponse>('/auth/login', credentials);
  } catch (error) {
    throw handleApiError(error as AxiosError);
  }
};

export const register = async (userData: RegisterForm): Promise<RegisterResponse> => {
  try {
    return await apiClient.post<RegisterResponse>('/auth/register', userData);
  } catch (error) {
    throw handleApiError(error as AxiosError);
  }
};

export const logout = async (): Promise<void> => {
  try {
    await apiClient.post('/auth/logout');
  } catch (error) {
    // Don't throw error for logout - continue with local cleanup
    console.error('Logout API error:', error);
  }
};

export const getCurrentUser = async (): Promise<User> => {
  try {
    const response = await apiClient.get<CurrentUserResponse>('/auth/me');
    return response.user;
  } catch (error) {
    throw handleApiError(error as AxiosError);
  }
};

export const refreshToken = async (refreshToken: string): Promise<AuthTokens> => {
  try {
    const response = await apiClient.post<{ tokens: AuthTokens }>('/auth/refresh', {
      refreshToken,
    });
    return response.tokens;
  } catch (error) {
    throw handleApiError(error as AxiosError);
  }
};

export const updateProfile = async (profileData: Partial<User>): Promise<User> => {
  try {
    const response = await apiClient.put<{ user: User }>('/auth/profile', profileData);
    return response.user;
  } catch (error) {
    throw handleApiError(error as AxiosError);
  }
};