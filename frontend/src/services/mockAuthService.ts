import { User, AuthTokens, LoginForm, RegisterForm } from '../types';
import { mockUsers, getMockUserByEmail, getMockUserById } from '../data/mockData';

// Simulate API delay
const delay = (ms: number = 500) => new Promise(resolve => setTimeout(resolve, ms));

// Mock token generation
const generateMockToken = (user: User): string => {
  return btoa(JSON.stringify({ userId: user.id, email: user.email, role: user.role }));
};

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

export const mockAuthService = {
  login: async (credentials: LoginForm): Promise<LoginResponse> => {
    await delay(800);
    
    const user = getMockUserByEmail(credentials.email);
    
    if (!user) {
      throw new Error('Invalid email or password');
    }
    
    // Mock password validation (in real app, this would be hashed)
    const validPasswords: Record<string, string> = {
      'customer@test.com': 'Password123',
      'admin@test.com': 'AdminPass123',
    };
    
    if (validPasswords[credentials.email] !== credentials.password) {
      throw new Error('Invalid email or password');
    }
    
    const tokens: AuthTokens = {
      accessToken: generateMockToken(user),
      refreshToken: `refresh_${generateMockToken(user)}`,
      expiresIn: '24h',
    };
    
    return {
      message: 'Login successful',
      user,
      tokens,
    };
  },

  register: async (userData: RegisterForm): Promise<RegisterResponse> => {
    await delay(1000);
    
    // Check if user already exists
    const existingUser = getMockUserByEmail(userData.email);
    if (existingUser) {
      throw new Error('User with this email already exists');
    }
    
    const newUser: User = {
      id: `user-${Date.now()}`,
      email: userData.email,
      firstName: userData.firstName,
      lastName: userData.lastName,
      role: 'customer',
      address: userData.address,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    mockUsers.push(newUser);
    
    const tokens: AuthTokens = {
      accessToken: generateMockToken(newUser),
      refreshToken: `refresh_${generateMockToken(newUser)}`,
      expiresIn: '24h',
    };
    
    return {
      message: 'User registered successfully',
      user: newUser,
      tokens,
    };
  },

  logout: async (): Promise<void> => {
    await delay(200);
    // In mock implementation, just resolve
  },

  getCurrentUser: async (): Promise<User> => {
    await delay(300);
    
    // Get user from stored token (mock implementation)
    const token = localStorage.getItem('accessToken');
    if (!token) {
      throw new Error('No valid token found');
    }
    
    try {
      const decoded = JSON.parse(atob(token));
      const user = getMockUserById(decoded.userId);
      
      if (!user) {
        throw new Error('User not found');
      }
      
      return user;
    } catch (error) {
      throw new Error('Invalid token');
    }
  },

  updateProfile: async (profileData: Partial<User>): Promise<User> => {
    await delay(600);
    
    const token = localStorage.getItem('accessToken');
    if (!token) {
      throw new Error('No valid token found');
    }
    
    const decoded = JSON.parse(atob(token));
    const userIndex = mockUsers.findIndex(u => u.id === decoded.userId);
    
    if (userIndex === -1) {
      throw new Error('User not found');
    }
    
    const updatedUser = {
      ...mockUsers[userIndex],
      ...profileData,
      updatedAt: new Date().toISOString(),
    };
    
    mockUsers[userIndex] = updatedUser;
    return updatedUser;
  },
};