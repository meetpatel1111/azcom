import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';
import { ApiError, AuthTokens } from '../types';

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Token management
class TokenManager {
  private static readonly ACCESS_TOKEN_KEY = 'accessToken';
  private static readonly REFRESH_TOKEN_KEY = 'refreshToken';

  static getAccessToken(): string | null {
    return localStorage.getItem(this.ACCESS_TOKEN_KEY);
  }

  static getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  static setTokens(tokens: AuthTokens): void {
    localStorage.setItem(this.ACCESS_TOKEN_KEY, tokens.accessToken);
    localStorage.setItem(this.REFRESH_TOKEN_KEY, tokens.refreshToken);
  }

  static clearTokens(): void {
    localStorage.removeItem(this.ACCESS_TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
  }

  static hasValidToken(): boolean {
    const token = this.getAccessToken();
    if (!token) return false;

    try {
      // Basic JWT validation (check if it's not expired)
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      return payload.exp > currentTime;
    } catch {
      return false;
    }
  }
}

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = TokenManager.getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as any;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = TokenManager.getRefreshToken();
      if (refreshToken) {
        try {
          const response = await axios.post('/api/auth/refresh', {
            refreshToken,
          });

          const { accessToken } = response.data.tokens;
          TokenManager.setTokens({ ...response.data.tokens });

          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        } catch (refreshError) {
          // Refresh failed, redirect to login
          TokenManager.clearTokens();
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      } else {
        // No refresh token, redirect to login
        TokenManager.clearTokens();
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

// API Error handler
export const handleApiError = (error: AxiosError): ApiError => {
  if (error.response?.data) {
    return error.response.data as ApiError;
  }

  if (error.request) {
    return {
      error: 'Network Error',
      message: 'Unable to connect to the server. Please check your internet connection.',
    };
  }

  return {
    error: 'Unknown Error',
    message: error.message || 'An unexpected error occurred.',
  };
};

// Generic API methods
export const apiClient = {
  get: <T = any>(url: string, params?: any): Promise<T> =>
    api.get(url, { params }).then((response) => response.data),

  post: <T = any>(url: string, data?: any): Promise<T> =>
    api.post(url, data).then((response) => response.data),

  put: <T = any>(url: string, data?: any): Promise<T> =>
    api.put(url, data).then((response) => response.data),

  patch: <T = any>(url: string, data?: any): Promise<T> =>
    api.patch(url, data).then((response) => response.data),

  delete: <T = any>(url: string): Promise<T> =>
    api.delete(url).then((response) => response.data),
};

export { TokenManager };
export default api;