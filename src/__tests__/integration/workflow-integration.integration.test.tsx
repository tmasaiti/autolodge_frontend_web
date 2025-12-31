import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { store } from '../../store/store';
import { BookingFlow } from '../../components/booking/BookingFlow';
import { DisputeCreationForm } from '../../components/disputes/DisputeCreationForm';
import { OperatorOnboardingWizard } from '../../components/operator/wizard/OperatorOnboardingWizard';
import { KYCDashboard } from '../../components/kyc/KYCDashboard';
import { AuthContext } from '../../contexts/AuthContext';
import { CurrencyContext } from '../../contexts/CurrencyContext';
import * as bookingService from '../../services/bookingService';
import * as disputeService from '../../services/disputeService';
import * as kycService from '../../services/kycService';
import * as paymentService from '../../services/paymentService';

// Mock services
vi.mock('../../services/bookingService');
vi.mock('../../services/disputeService');
vi.mock('../../services/kycService');
vi.mock('../../services/paymentService');

const mockAuthContextRenter = {
  user: {
    id: '1',
    email: 'renter@example.com',
    name: 'Test Renter',
    role: 'renter' as const,
    isVerified: true,
    kycStatus: 'approved',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  login: vi.fn(),
  logout: vi.fn(),
  register: vi.fn(),
  isLoading: false,
  error: null
};

const mockAuthContextOperator = {
  user: {
    id: '2',
    email: 'operator@example.com',
    name: 'Test Operator',
    role: 'operator' as const,
    isVerified: false,
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

const mockCurrencyContext = {
  currency: 'USD',
  setCurrency: vi.fn(),
  exchangeRates: { USD: 1, EUR: 0.85, GBP: 0.73, ZWL: 320 },
  convertAmount: (amount: number) => amount,
  formatAmount: (amount: number) => `$${amount.toFixed(2)}`
};

const TestWrapper = ({ children, authContext = mockAuthContextRenter }: { 
  children: React.ReactNode;
  authContext?: any;
}) => (
  <Provider store={store}>
    <BrowserRouter>
      <AuthContext.Provider value={authContext}>
        <CurrencyContext.Provider value={mockCurrencyContext}>
          {children}
        </CurrencyContext.Provider>
      </AuthContext.Provider>
    </BrowserRouter>
  </Provider>
);

const mockBooking = {
  id: 'booking_123',
  vehicleId: 'vehicle_1',
  userId: '1',
  startDate: '2024-01-15',
  endDate: '2024-01-20',
  status: 'confirmed',
  totalAmount: 320,
  currency: 'USD',
  paymentStatus: 'completed',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

const mockDispute = {
  id: 'dispute_123',
  bookingId: 'booking_123',
  reporterId: '1',
  type: 'vehicle_condition',
  status: 'open',
  description: 'Vehicle had damage not disclosed',
  evidence: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

describe('Complex Workflow Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock service responses
    vi.mocked(bookingService.createBooking).mockResolvedValue(mockBooking);
    vi.mocked(bookingService.getBookingById).mockResolvedValue(mockBooking);
    vi.mocked(disputeService.createDispute).mockResolvedValue(mockDispute);
    vi.mocked(paymentService.processPayment).mockResolvedValue({
      success: true,
      transactionId: 'txn_123',
      paymentMethod: 'card',
      amount: 320,
      currency: 'USD'
    });
  });

  it('should handle complete booking-to-dispute workflow', async () => {
    const mockOnBookingComplete = vi.fn();
    const mockOnCancel = vi.fn();

    // Step 1: Complete booking
    const { rerender } = render(
      <TestWrapper>
        <BookingFlow 
          vehicleId="vehicle_1"
          onBookingComplete={mockOnBookingComplete}
          onCancel={mockOnCancel}
        />
      </TestWrapper>
    );

    // Complete booking flow
    const startDateInput = screen.getByLabelText(/start date/i);
    const endDateInput = screen.getByLabelText(/end date/i);
    
    fireEvent.change(startDateInput, { target: { value: '2024-01-15' } });
    fireEvent.change(endDateInput, { target: { value: '2024-01-20' } });
    
    let nextButton = screen.getByRole('button', { name: /continue/i });
    fireEvent.click(nextButton);

    // Insurance step
    await waitFor(() => {
      expect(screen.getByText(/insurance/i)).toBeInTheDocument();
    });
    
    const basicInsurance = screen.getByLabelText(/basic insurance/i);
    fireEvent.click(basicInsurance);
    fireEvent.click(nextButton);

    // Payment step
    await waitFor(() => {
      expect(screen.getByText(/payment/i)).toBeInTheDocument();
    });
    
    const cardNumberInput = screen.getByLabelText(/card number/i);
    fireEvent.change(cardNumberInput, { target: { value: '4242424242424242' } });
    
    const completeButton = screen.getByRole('button', { name: /complete booking/i });
    fireEvent.click(completeButton);

    // Booking should complete
    await waitFor(() => {
      expect(mockOnBookingComplete).toHaveBeenCalled();
    });

    // Step 2: Create dispute for the booking
    rerender(
      <TestWrapper>
        <DisputeCreationForm 
          bookingId="booking_123"
          onSubmit={vi.fn()}
          onCancel={vi.fn()}
        />
      </TestWrapper>
    );

    // Fill dispute form
    const disputeTypeSelect = screen.getByLabelText(/dispute type/i);
    fireEvent.change(disputeTypeSelect, { target: { value: 'vehicle_condition' } });
    
    const descriptionTextarea = screen.getByLabelText(/description/i);
    fireEvent.change(descriptionTextarea, { 
      target: { value: 'Vehicle had damage not disclosed in listing' } 
    });
    
    // Upload evidence
    const fileInput = screen.getByLabelText(/upload evidence/i);
    const file = new File(['evidence'], 'damage-photo.jpg', { type: 'image/jpeg' });
    fireEvent.change(fileInput, { target: { files: [file] } });
    
    // Submit dispute
    const submitDisputeButton = screen.getByRole('button', { name: /submit dispute/i });
    fireEvent.click(submitDisputeButton);

    // Dispute should be created
    await waitFor(() => {
      expect(disputeService.createDispute).toHaveBeenCalledWith({
        bookingId: 'booking_123',
        type: 'vehicle_condition',
        description: 'Vehicle had damage not disclosed in listing',
        evidence: expect.any(Array)
      });
    });
  });

  it('should handle operator onboarding to vehicle listing workflow', async () => {
    const mockOnComplete = vi.fn();

    render(
      <TestWrapper authContext={mockAuthContextOperator}>
        <OperatorOnboardingWizard onComplete={mockOnComplete} />
      </TestWrapper>
    );

    // Step 1: Business Information
    expect(screen.getByText(/business information/i)).toBeInTheDocument();
    
    const businessNameInput = screen.getByLabelText(/business name/i);
    const businessTypeSelect = screen.getByLabelText(/business type/i);
    const taxIdInput = screen.getByLabelText(/tax id/i);
    
    fireEvent.change(businessNameInput, { target: { value: 'Test Car Rental' } });
    fireEvent.change(businessTypeSelect, { target: { value: 'limited_company' } });
    fireEvent.change(taxIdInput, { target: { value: '123456789' } });
    
    let nextButton = screen.getByRole('button', { name: /next/i });
    fireEvent.click(nextButton);

    // Step 2: Documents
    await waitFor(() => {
      expect(screen.getByText(/upload documents/i)).toBeInTheDocument();
    });
    
    const businessLicenseInput = screen.getByLabelText(/business license/i);
    const insuranceInput = screen.getByLabelText(/insurance certificate/i);
    
    const licenseFile = new File(['license'], 'business-license.pdf', { type: 'application/pdf' });
    const insuranceFile = new File(['insurance'], 'insurance.pdf', { type: 'application/pdf' });
    
    fireEvent.change(businessLicenseInput, { target: { files: [licenseFile] } });
    fireEvent.change(insuranceInput, { target: { files: [insuranceFile] } });
    
    fireEvent.click(nextButton);

    // Step 3: Verification
    await waitFor(() => {
      expect(screen.getByText(/verification/i)).toBeInTheDocument();
    });
    
    const phoneInput = screen.getByLabelText(/phone number/i);
    fireEvent.change(phoneInput, { target: { value: '+263771234567' } });
    
    const verifyPhoneButton = screen.getByRole('button', { name: /verify phone/i });
    fireEvent.click(verifyPhoneButton);
    
    // Mock verification code
    await waitFor(() => {
      expect(screen.getByLabelText(/verification code/i)).toBeInTheDocument();
    });
    
    const codeInput = screen.getByLabelText(/verification code/i);
    fireEvent.change(codeInput, { target: { value: '123456' } });
    
    const verifyCodeButton = screen.getByRole('button', { name: /verify code/i });
    fireEvent.click(verifyCodeButton);
    
    fireEvent.click(nextButton);

    // Step 4: Fleet Setup
    await waitFor(() => {
      expect(screen.getByText(/fleet setup/i)).toBeInTheDocument();
    });
    
    const vehicleMakeInput = screen.getByLabelText(/make/i);
    const vehicleModelInput = screen.getByLabelText(/model/i);
    const vehicleYearInput = screen.getByLabelText(/year/i);
    const priceInput = screen.getByLabelText(/daily price/i);
    
    fireEvent.change(vehicleMakeInput, { target: { value: 'Toyota' } });
    fireEvent.change(vehicleModelInput, { target: { value: 'Camry' } });
    fireEvent.change(vehicleYearInput, { target: { value: '2023' } });
    fireEvent.change(priceInput, { target: { value: '50' } });
    
    const completeButton = screen.getByRole('button', { name: /complete setup/i });
    fireEvent.click(completeButton);

    // Onboarding should complete
    await waitFor(() => {
      expect(mockOnComplete).toHaveBeenCalled();
    });
  });

  it('should handle KYC verification to booking approval workflow', async () => {
    const mockAuthContextUnverified = {
      ...mockAuthContextRenter,
      user: {
        ...mockAuthContextRenter.user,
        isVerified: false,
        kycStatus: 'pending'
      }
    };

    // Mock KYC data progression
    const initialKYCData = {
      status: 'pending',
      documents: [],
      verificationSteps: [
        { step: 'identity', status: 'not_started' },
        { step: 'address', status: 'not_started' },
        { step: 'financial', status: 'not_started' }
      ]
    };

    const completedKYCData = {
      status: 'approved',
      documents: [
        { id: 'doc_1', type: 'passport', status: 'approved' },
        { id: 'doc_2', type: 'utility_bill', status: 'approved' }
      ],
      verificationSteps: [
        { step: 'identity', status: 'completed' },
        { step: 'address', status: 'completed' },
        { step: 'financial', status: 'completed' }
      ]
    };

    vi.mocked(kycService.getKYCStatus)
      .mockResolvedValueOnce(initialKYCData)
      .mockResolvedValue(completedKYCData);

    const { rerender } = render(
      <TestWrapper authContext={mockAuthContextUnverified}>
        <KYCDashboard userId="1" />
      </TestWrapper>
    );

    // Should show KYC requirements
    await waitFor(() => {
      expect(screen.getByText(/verification required/i)).toBeInTheDocument();
    });

    // Upload identity document
    const uploadButton = screen.getByRole('button', { name: /upload.*document/i });
    fireEvent.click(uploadButton);
    
    await waitFor(() => {
      expect(screen.getByLabelText(/document type/i)).toBeInTheDocument();
    });
    
    const docTypeSelect = screen.getByLabelText(/document type/i);
    fireEvent.change(docTypeSelect, { target: { value: 'passport' } });
    
    const fileInput = screen.getByLabelText(/choose file/i);
    const passportFile = new File(['passport'], 'passport.jpg', { type: 'image/jpeg' });
    fireEvent.change(fileInput, { target: { files: [passportFile] } });
    
    const uploadSubmitButton = screen.getByRole('button', { name: /upload/i });
    fireEvent.click(uploadSubmitButton);

    // Upload address document
    fireEvent.click(uploadButton);
    
    await waitFor(() => {
      expect(screen.getByLabelText(/document type/i)).toBeInTheDocument();
    });
    
    fireEvent.change(docTypeSelect, { target: { value: 'utility_bill' } });
    
    const utilityFile = new File(['utility'], 'utility-bill.pdf', { type: 'application/pdf' });
    fireEvent.change(fileInput, { target: { files: [utilityFile] } });
    fireEvent.click(uploadSubmitButton);

    // Simulate KYC approval
    rerender(
      <TestWrapper authContext={mockAuthContextRenter}>
        <KYCDashboard userId="1" />
      </TestWrapper>
    );

    // Should show approved status
    await waitFor(() => {
      expect(screen.getByText(/verification complete/i)).toBeInTheDocument();
    });

    // Now user should be able to make bookings
    rerender(
      <TestWrapper authContext={mockAuthContextRenter}>
        <BookingFlow 
          vehicleId="vehicle_1"
          onBookingComplete={vi.fn()}
          onCancel={vi.fn()}
        />
      </TestWrapper>
    );

    // Should not show KYC blocking message
    expect(screen.queryByText(/verification required/i)).not.toBeInTheDocument();
    
    // Should show booking form
    expect(screen.getByLabelText(/start date/i)).toBeInTheDocument();
  });

  it('should handle cross-border booking with permit workflow', async () => {
    const mockOnBookingComplete = vi.fn();
    const mockOnCancel = vi.fn();

    // Mock cross-border destinations
    vi.mocked(bookingService.getCrossBorderDestinations).mockResolvedValue([
      {
        country_code: 'ZA',
        country_name: 'South Africa',
        permit_required: true,
        processing_days: 5,
        surcharge_amount: 100,
        currency: 'USD',
        restrictions: ['Valid passport required'],
        insurance_requirements: ['Third party liability'],
        border_crossing_points: ['Beitbridge']
      }
    ]);

    render(
      <TestWrapper>
        <BookingFlow 
          vehicleId="vehicle_1"
          onBookingComplete={mockOnBookingComplete}
          onCancel={mockOnCancel}
        />
      </TestWrapper>
    );

    // Fill dates
    const startDateInput = screen.getByLabelText(/start date/i);
    const endDateInput = screen.getByLabelText(/end date/i);
    
    fireEvent.change(startDateInput, { target: { value: '2024-01-15' } });
    fireEvent.change(endDateInput, { target: { value: '2024-01-20' } });
    
    // Enable cross-border travel
    const crossBorderToggle = screen.getByLabelText(/cross.border/i);
    fireEvent.click(crossBorderToggle);
    
    let nextButton = screen.getByRole('button', { name: /continue/i });
    fireEvent.click(nextButton);

    // Cross-border step
    await waitFor(() => {
      expect(screen.getByText(/destination country/i)).toBeInTheDocument();
    });
    
    // Select South Africa
    const southAfricaOption = screen.getByText(/south africa/i);
    fireEvent.click(southAfricaOption);
    
    // Should show permit requirements
    expect(screen.getByText(/permit required/i)).toBeInTheDocument();
    expect(screen.getByText(/5 days/i)).toBeInTheDocument();
    expect(screen.getByText(/\\$100.*surcharge/i)).toBeInTheDocument();
    
    // Accept permit requirements
    const acceptPermitCheckbox = screen.getByLabelText(/accept.*permit/i);
    fireEvent.click(acceptPermitCheckbox);
    
    fireEvent.click(nextButton);

    // Insurance step (should include cross-border requirements)
    await waitFor(() => {
      expect(screen.getByText(/insurance/i)).toBeInTheDocument();
    });
    
    // Should show cross-border insurance requirements
    expect(screen.getByText(/third party liability/i)).toBeInTheDocument();
    
    const crossBorderInsurance = screen.getByLabelText(/cross.border.*insurance/i);
    fireEvent.click(crossBorderInsurance);
    fireEvent.click(nextButton);

    // Payment step should include surcharge
    await waitFor(() => {
      expect(screen.getByText(/payment/i)).toBeInTheDocument();
    });
    
    // Should show total with surcharge
    expect(screen.getByText(/\\$420/)).toBeInTheDocument(); // 320 + 100 surcharge
    
    // Complete payment
    const cardNumberInput = screen.getByLabelText(/card number/i);
    fireEvent.change(cardNumberInput, { target: { value: '4242424242424242' } });
    
    const completeButton = screen.getByRole('button', { name: /complete booking/i });
    fireEvent.click(completeButton);

    // Should complete cross-border booking
    await waitFor(() => {
      expect(mockOnBookingComplete).toHaveBeenCalled();
    });
    
    // Verify cross-border booking was created
    expect(bookingService.createBooking).toHaveBeenCalledWith(
      expect.objectContaining({
        crossBorder: {
          destinationCountry: 'ZA',
          permitRequired: true,
          surchargeAmount: 100
        }
      })
    );
  });

  it('should handle payment failure to dispute escalation workflow', async () => {
    const mockOnBookingComplete = vi.fn();
    const mockOnCancel = vi.fn();

    // Mock payment failure
    vi.mocked(paymentService.processPayment).mockRejectedValue(
      new Error('Payment failed: Card declined')
    );

    const { rerender } = render(
      <TestWrapper>
        <BookingFlow 
          vehicleId="vehicle_1"
          onBookingComplete={mockOnBookingComplete}
          onCancel={mockOnCancel}
        />
      </TestWrapper>
    );

    // Complete booking flow to payment
    const startDateInput = screen.getByLabelText(/start date/i);
    const endDateInput = screen.getByLabelText(/end date/i);
    
    fireEvent.change(startDateInput, { target: { value: '2024-01-15' } });
    fireEvent.change(endDateInput, { target: { value: '2024-01-20' } });
    
    let nextButton = screen.getByRole('button', { name: /continue/i });
    fireEvent.click(nextButton);

    // Skip insurance
    await waitFor(() => {
      expect(screen.getByText(/insurance/i)).toBeInTheDocument();
    });
    
    const basicInsurance = screen.getByLabelText(/basic insurance/i);
    fireEvent.click(basicInsurance);
    fireEvent.click(nextButton);

    // Payment step
    await waitFor(() => {
      expect(screen.getByText(/payment/i)).toBeInTheDocument();
    });
    
    const cardNumberInput = screen.getByLabelText(/card number/i);
    fireEvent.change(cardNumberInput, { target: { value: '4000000000000002' } }); // Declined card
    
    const completeButton = screen.getByRole('button', { name: /complete booking/i });
    fireEvent.click(completeButton);

    // Should show payment failure
    await waitFor(() => {
      expect(screen.getByText(/payment failed/i)).toBeInTheDocument();
    });
    
    // Should offer dispute option for payment issues
    const disputeButton = screen.getByRole('button', { name: /report.*issue/i });
    fireEvent.click(disputeButton);

    // Should navigate to dispute creation
    rerender(
      <TestWrapper>
        <DisputeCreationForm 
          bookingId="booking_123"
          onSubmit={vi.fn()}
          onCancel={vi.fn()}
          initialType="payment_issue"
        />
      </TestWrapper>
    );

    // Should pre-fill payment issue type
    const disputeTypeSelect = screen.getByLabelText(/dispute type/i);
    expect(disputeTypeSelect).toHaveValue('payment_issue');
    
    // Fill description
    const descriptionTextarea = screen.getByLabelText(/description/i);
    fireEvent.change(descriptionTextarea, { 
      target: { value: 'Payment was declined but amount was charged to my account' } 
    });
    
    // Submit dispute
    const submitDisputeButton = screen.getByRole('button', { name: /submit dispute/i });
    fireEvent.click(submitDisputeButton);

    // Should create payment dispute
    await waitFor(() => {
      expect(disputeService.createDispute).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'payment_issue',
          description: 'Payment was declined but amount was charged to my account'
        })
      );
    });
  });
});