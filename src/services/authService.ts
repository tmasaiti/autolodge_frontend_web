/**
 * Authentication Service
 * Handles login, registration, MFA, and session management
 */

import apiClient from './api';
import { UserProfile, UserVerificationStatus } from '../schemas/user-schemas';

export interface LoginCredentials {
  email: string;
  password: string;
  remember_me?: boolean;
}

export interface RegisterData {
  email: string;
  password: string;
  confirm_password: string;
  profile: Partial<UserProfile>;
  terms_accepted: boolean;
  marketing_consent?: boolean;
}

export interface AuthResponse {
  user: {
    id: number;
    email: string;
    phone?: string;
    profile: UserProfile;
    verification_status: UserVerificationStatus;
    created_at: string;
    updated_at: string;
  };
  tokens: {
    access_token: string;
    refresh_token: string;
    expires_in: number;
  };
  session: {
    session_id: string;
    device_id: string;
    expires_at: string;
  };
}

export interface MFASetupResponse {
  qr_code: string;
  backup_codes: string[];
  secret: string;
}

export interface MFAVerificationRequest {
  code: string;
  backup_code?: string;
}

export interface SessionInfo {
  session_id: string;
  device_info: {
    device_type: string;
    browser: string;
    os: string;
    ip_address: string;
    location?: string;
  };
  created_at: string;
  last_activity: string;
  is_current: boolean;
}

export interface SecuritySettings {
  mfa_enabled: boolean;
  login_notifications: boolean;
  device_tracking: boolean;
  session_timeout: number; // minutes
  failed_attempts: number;
  lockout_until?: string;
}

class AuthService {
  private readonly TOKEN_KEY = 'auth_token';
  private readonly REFRESH_TOKEN_KEY = 'refresh_token';
  private readonly SESSION_KEY = 'session_id';
  private readonly DEVICE_KEY = 'device_id';

  /**
   * Login with progressive security
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const response = await apiClient.post<AuthResponse>('/auth/login', {
        ...credentials,
        device_info: this.getDeviceInfo()
      });

      this.storeTokens(response.data.tokens);
      this.storeSession(response.data.session);
      
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 429) {
        throw new Error('Too many login attempts. Please try again later.');
      }
      if (error.response?.status === 423) {
        throw new Error('Account temporarily locked due to security concerns.');
      }
      throw new Error(error.response?.data?.message || 'Login failed');
    }
  }

  /**
   * Register new user with progressive security
   */
  async register(data: RegisterData): Promise<AuthResponse> {
    try {
      const response = await apiClient.post<AuthResponse>('/auth/register', {
        ...data,
        device_info: this.getDeviceInfo()
      });

      this.storeTokens(response.data.tokens);
      this.storeSession(response.data.session);
      
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Registration failed');
    }
  }

  /**
   * Logout and clear session
   */
  async logout(): Promise<void> {
    try {
      const sessionId = localStorage.getItem(this.SESSION_KEY);
      if (sessionId) {
        await apiClient.post('/auth/logout', { session_id: sessionId });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      this.clearTokens();
    }
  }

  /**
   * Refresh access token
   */
  async refreshToken(): Promise<string> {
    const refreshToken = localStorage.getItem(this.REFRESH_TOKEN_KEY);
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await apiClient.post<{ access_token: string; expires_in: number }>('/auth/refresh', {
        refresh_token: refreshToken
      });

      localStorage.setItem(this.TOKEN_KEY, response.data.access_token);
      return response.data.access_token;
    } catch (error) {
      this.clearTokens();
      throw new Error('Token refresh failed');
    }
  }

  /**
   * Setup Multi-Factor Authentication
   */
  async setupMFA(): Promise<MFASetupResponse> {
    const response = await apiClient.post<MFASetupResponse>('/auth/mfa/setup');
    return response.data;
  }

  /**
   * Verify MFA setup
   */
  async verifyMFASetup(verification: MFAVerificationRequest): Promise<void> {
    await apiClient.post('/auth/mfa/verify-setup', verification);
  }

  /**
   * Verify MFA during login
   */
  async verifyMFA(verification: MFAVerificationRequest): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/mfa/verify', verification);
    
    this.storeTokens(response.data.tokens);
    this.storeSession(response.data.session);
    
    return response.data;
  }

  /**
   * Disable MFA
   */
  async disableMFA(password: string): Promise<void> {
    await apiClient.post('/auth/mfa/disable', { password });
  }

  /**
   * Get active sessions
   */
  async getSessions(): Promise<SessionInfo[]> {
    const response = await apiClient.get<SessionInfo[]>('/auth/sessions');
    return response.data;
  }

  /**
   * Terminate specific session
   */
  async terminateSession(sessionId: string): Promise<void> {
    await apiClient.delete(`/auth/sessions/${sessionId}`);
  }

  /**
   * Terminate all other sessions
   */
  async terminateAllOtherSessions(): Promise<void> {
    const currentSessionId = localStorage.getItem(this.SESSION_KEY);
    await apiClient.post('/auth/sessions/terminate-others', { 
      current_session_id: currentSessionId 
    });
  }

  /**
   * Get security settings
   */
  async getSecuritySettings(): Promise<SecuritySettings> {
    const response = await apiClient.get<SecuritySettings>('/auth/security');
    return response.data;
  }

  /**
   * Update security settings
   */
  async updateSecuritySettings(settings: Partial<SecuritySettings>): Promise<void> {
    await apiClient.patch('/auth/security', settings);
  }

  /**
   * Send password reset email
   */
  async requestPasswordReset(email: string): Promise<void> {
    await apiClient.post('/auth/password-reset/request', { email });
  }

  /**
   * Reset password with token
   */
  async resetPassword(token: string, newPassword: string): Promise<void> {
    await apiClient.post('/auth/password-reset/confirm', {
      token,
      new_password: newPassword
    });
  }

  /**
   * Change password (authenticated user)
   */
  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await apiClient.post('/auth/password-change', {
      current_password: currentPassword,
      new_password: newPassword
    });
  }

  /**
   * Verify email address
   */
  async verifyEmail(token: string): Promise<void> {
    await apiClient.post('/auth/email/verify', { token });
  }

  /**
   * Resend email verification
   */
  async resendEmailVerification(): Promise<void> {
    await apiClient.post('/auth/email/resend-verification');
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    const token = localStorage.getItem(this.TOKEN_KEY);
    return !!token && !this.isTokenExpired(token);
  }

  /**
   * Get current access token
   */
  getAccessToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  /**
   * Store authentication tokens
   */
  private storeTokens(tokens: { access_token: string; refresh_token: string }): void {
    localStorage.setItem(this.TOKEN_KEY, tokens.access_token);
    localStorage.setItem(this.REFRESH_TOKEN_KEY, tokens.refresh_token);
  }

  /**
   * Store session information
   */
  private storeSession(session: { session_id: string; device_id: string }): void {
    localStorage.setItem(this.SESSION_KEY, session.session_id);
    localStorage.setItem(this.DEVICE_KEY, session.device_id);
  }

  /**
   * Clear all stored tokens and session data
   */
  private clearTokens(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    localStorage.removeItem(this.SESSION_KEY);
    localStorage.removeItem(this.DEVICE_KEY);
  }

  /**
   * Check if token is expired
   */
  private isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp * 1000 < Date.now();
    } catch {
      return true;
    }
  }

  /**
   * Get device information for tracking
   */
  private getDeviceInfo() {
    return {
      user_agent: navigator.userAgent,
      screen_resolution: `${screen.width}x${screen.height}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: navigator.language,
      platform: navigator.platform
    };
  }
}

export const authService = new AuthService();