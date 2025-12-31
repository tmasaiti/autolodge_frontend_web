import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { store } from '../../store/store';
import { LoginForm } from '../../components/auth/LoginForm';
import { RegisterForm } from '../../components/auth/RegisterForm';
import { MFASetup } from '../../components/auth/MFASetup';
import { ProfilePage } from '../../pages/ProfilePage';
import { KYCDashboard } from '../../components/kyc/KYCDashboard';
import { AuthContext } from '../../contexts/AuthContext';
import * as authService from '../../services/authService';
import * as kycService from '../../services/kycService';

// Mock services
vi.mock('../../services/authService');
vi.mock('../../services/kycService');

const mockAuthContextLoggedOut = {
  user: null,
  login: vi.fn(),
  logout: vi.fn(),
  register: vi.fn(),
  isLoading: false,
  error: null
};

const mockAuthContextLoggedIn = {
  user: {
    id: '1',
    email: 'test@example.com',
    name: 'Test User',
    role: 'renter' as const,
    isVerified: false,
    mfaEnabled: false,
    kycStatus: 'pending',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  login: vi.fn(),
  logout: vi.fn(),
  register: vi.fn(),
  isLoading: false,
  error: null
};

const TestWrapper = ({ children, authContext = mockAuthContextLoggedOut }: { 
  children: React.ReactNode;
  authContext?: any;
}) => (
  <Provider store={store}>
    <BrowserRouter>
      <AuthContext.Provider value={authContext}>
        {children}
      </AuthContext.Provider>
    </BrowserRouter>
  </Provider>
);

const mockUser = {
  id: '1',
  email: 'test@example.com',
  name: 'Test User',
  role: 'renter' as const,
  isVerified: false,
  mfaEnabled: false,
  kycStatus: 'pending',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

const mockKYCData = {
  status: 'pending',
  documents: [
    {
      id: 'doc_1',
      type: 'passport',
      status: 'approved',
      uploadedAt: '2024-01-10T10:00:00Z'
    },
    {
      id: 'doc_2',
      type: 'drivers_license',
      status: 'pending',
      uploadedAt: '2024-01-12T14:00:00Z'
    }
  ],
  verificationSteps: [
    { step: 'identity', status: 'completed' },
    { step: 'address', status: 'pending' },
    { step: 'financial', status: 'not_started' }
  ]
};

describe('Authentication Flow Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock service responses
    vi.mocked(authService.login).mockResolvedValue({
      user: mockUser,
      token: 'jwt_token_123',
      refreshToken: 'refresh_token_123'
    });
    
    vi.mocked(authService.register).mockResolvedValue({
      user: mockUser,
      token: 'jwt_token_123',
      refreshToken: 'refresh_token_123'
    });
    
    vi.mocked(authService.setupMFA).mockResolvedValue({
      secret: 'MFASECRET123',
      qrCode: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...',
      backupCodes: ['123456', '789012']
    });
    
    vi.mocked(kycService.getKYCStatus).mockResolvedValue(mockKYCData);
  });

  it('should complete user registration flow', async () => {
    const mockOnSuccess = vi.fn();
    const mockOnError = vi.fn();

    render(
      <TestWrapper>
        <RegisterForm 
          onSuccess={mockOnSuccess}
          onError={mockOnError}
        />
      </TestWrapper>
    );

    // Fill registration form
    const nameInput = screen.getByLabelText(/full name/i);
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/^password/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
    const roleSelect = screen.getByLabelText(/role/i);
    const termsCheckbox = screen.getByLabelText(/terms.*conditions/i);
    
    fireEvent.change(nameInput, { target: { value: 'Test User' } });
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'SecurePassword123!' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'SecurePassword123!' } });
    fireEvent.change(roleSelect, { target: { value: 'renter' } });
    fireEvent.click(termsCheckbox);
    
    // Submit registration
    const registerButton = screen.getByRole('button', { name: /register/i });
    fireEvent.click(registerButton);

    // Should show loading state
    expect(screen.getByText(/creating account/i)).toBeInTheDocument();
    
    // Wait for registration completion
    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalledWith({
        user: mockUser,
        token: 'jwt_token_123',
        refreshToken: 'refresh_token_123'
      });
    });
    
    // Verify registration service was called
    expect(authService.register).toHaveBeenCalledWith({
      name: 'Test User',
      email: 'test@example.com',
      password: 'SecurePassword123!',
      role: 'renter'
    });
  });

  it('should handle login flow with MFA', async () => {
    const mockOnSuccess = vi.fn();
    const mockOnError = vi.fn();

    // Mock user with MFA enabled
    const userWithMFA = { ...mockUser, mfaEnabled: true };
    vi.mocked(authService.login).mockResolvedValue({
      user: userWithMFA,
      token: 'jwt_token_123',
      refreshToken: 'refresh_token_123',
      requiresMFA: true
    });
    
    vi.mocked(authService.verifyMFA).mockResolvedValue({
      user: userWithMFA,
      token: 'jwt_token_123',
      refreshToken: 'refresh_token_123'
    });

    render(
      <TestWrapper>
        <LoginForm 
          onSuccess={mockOnSuccess}
          onError={mockOnError}
        />
      </TestWrapper>
    );

    // Fill login credentials
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'SecurePassword123!' } });
    
    // Submit login
    const loginButton = screen.getByRole('button', { name: /login/i });
    fireEvent.click(loginButton);

    // Should show MFA prompt
    await waitFor(() => {
      expect(screen.getByText(/enter.*code/i)).toBeInTheDocument();
    });
    
    // Fill MFA code
    const mfaInput = screen.getByLabelText(/verification code/i);
    fireEvent.change(mfaInput, { target: { value: '123456' } });
    
    // Submit MFA
    const verifyButton = screen.getByRole('button', { name: /verify/i });
    fireEvent.click(verifyButton);

    // Should complete login
    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalledWith({
        user: userWithMFA,
        token: 'jwt_token_123',
        refreshToken: 'refresh_token_123'
      });
    });
    
    // Verify services were called
    expect(authService.login).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'SecurePassword123!'
    });
    expect(authService.verifyMFA).toHaveBeenCalledWith('123456');
  });

  it('should handle MFA setup flow', async () => {
    render(
      <TestWrapper authContext={mockAuthContextLoggedIn}>
        <MFASetup onComplete={vi.fn()} />
      </TestWrapper>
    );

    // Should show MFA setup options
    expect(screen.getByText(/multi.factor authentication/i)).toBeInTheDocument();
    
    // Select authenticator app
    const authenticatorOption = screen.getByLabelText(/authenticator app/i);
    fireEvent.click(authenticatorOption);
    
    // Should show QR code and secret
    await waitFor(() => {
      expect(screen.getByText(/scan.*qr code/i)).toBeInTheDocument();
    });
    
    expect(screen.getByText(/MFASECRET123/)).toBeInTheDocument();
    
    // Should show backup codes
    expect(screen.getByText(/backup codes/i)).toBeInTheDocument();
    expect(screen.getByText(/123456/)).toBeInTheDocument();
    expect(screen.getByText(/789012/)).toBeInTheDocument();
    
    // Verify setup code
    const verificationInput = screen.getByLabelText(/enter.*code/i);
    fireEvent.change(verificationInput, { target: { value: '123456' } });
    
    const enableButton = screen.getByRole('button', { name: /enable mfa/i });
    fireEvent.click(enableButton);

    // Should show success message
    await waitFor(() => {
      expect(screen.getByText(/mfa.*enabled/i)).toBeInTheDocument();
    });
    
    // Verify MFA setup service was called
    expect(authService.setupMFA).toHaveBeenCalled();
  });

  it('should complete KYC verification flow', async () => {
    render(
      <TestWrapper authContext={mockAuthContextLoggedIn}>
        <KYCDashboard userId="1" />
      </TestWrapper>
    );

    // Should load KYC status
    await waitFor(() => {
      expect(screen.getByText(/verification status/i)).toBeInTheDocument();
    });
    
    // Should show verification steps
    expect(screen.getByText(/identity.*completed/i)).toBeInTheDocument();
    expect(screen.getByText(/address.*pending/i)).toBeInTheDocument();
    expect(screen.getByText(/financial.*not started/i)).toBeInTheDocument();
    
    // Should show document status
    expect(screen.getByText(/passport.*approved/i)).toBeInTheDocument();
    expect(screen.getByText(/drivers.*license.*pending/i)).toBeInTheDocument();
    
    // Upload additional document
    const uploadButton = screen.getByRole('button', { name: /upload.*document/i });
    fireEvent.click(uploadButton);
    
    // Should show upload modal
    await waitFor(() => {
      expect(screen.getByText(/upload.*document/i)).toBeInTheDocument();
    });
    
    // Select document type
    const docTypeSelect = screen.getByLabelText(/document type/i);
    fireEvent.change(docTypeSelect, { target: { value: 'utility_bill' } });
    
    // Mock file upload
    const fileInput = screen.getByLabelText(/choose file/i);
    const file = new File(['test'], 'utility-bill.pdf', { type: 'application/pdf' });
    fireEvent.change(fileInput, { target: { files: [file] } });
    
    // Submit upload
    const submitButton = screen.getByRole('button', { name: /upload/i });
    fireEvent.click(submitButton);

    // Should show upload success
    await waitFor(() => {
      expect(screen.getByText(/document uploaded/i)).toBeInTheDocument();
    });
  });

  it('should handle profile management and updates', async () => {
    render(
      <TestWrapper authContext={mockAuthContextLoggedIn}>
        <ProfilePage />
      </TestWrapper>
    );

    // Should display user profile
    expect(screen.getByDisplayValue('Test User')).toBeInTheDocument();
    expect(screen.getByDisplayValue('test@example.com')).toBeInTheDocument();
    
    // Edit profile information
    const nameInput = screen.getByDisplayValue('Test User');
    fireEvent.change(nameInput, { target: { value: 'Updated Test User' } });
    
    // Add phone number
    const phoneInput = screen.getByLabelText(/phone/i);
    fireEvent.change(phoneInput, { target: { value: '+263771234567' } });
    
    // Save changes
    const saveButton = screen.getByRole('button', { name: /save/i });
    fireEvent.click(saveButton);

    // Should show success message
    await waitFor(() => {
      expect(screen.getByText(/profile updated/i)).toBeInTheDocument();
    });
    
    // Should update display
    expect(screen.getByDisplayValue('Updated Test User')).toBeInTheDocument();
  });

  it('should handle authentication errors gracefully', async () => {
    const mockOnSuccess = vi.fn();
    const mockOnError = vi.fn();

    // Mock login failure
    vi.mocked(authService.login).mockRejectedValue(
      new Error('Invalid credentials')
    );

    render(
      <TestWrapper>
        <LoginForm 
          onSuccess={mockOnSuccess}
          onError={mockOnError}
        />
      </TestWrapper>
    );

    // Fill invalid credentials
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });
    
    // Submit login
    const loginButton = screen.getByRole('button', { name: /login/i });
    fireEvent.click(loginButton);

    // Should show error message
    await waitFor(() => {
      expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
    });
    
    expect(mockOnError).toHaveBeenCalledWith(new Error('Invalid credentials'));
    
    // Should allow retry
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
  });
});