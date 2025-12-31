/**
 * Services Index
 * Centralized exports for all service modules
 */

export { api } from './api';
export { bookingService } from './bookingService';
export { currencyService } from './currencyService';
export { disputeService } from './disputeService';
export { insuranceService } from './insuranceService';
export { paymentService } from './paymentService';
export { zimbabwePaymentService } from './zimbabwePaymentService';
export { permitService } from './permitService';
export { priceLockService } from './priceLockService';
export { savedSearchService } from './savedSearchService';
export { searchAlertService } from './searchAlertService';
export { searchAnalyticsService } from './searchAnalyticsService';
export { vehicleService } from './vehicleService';

// Re-export types
export type { PermitSearchFilters, PermitStatusUpdate, DocumentUploadResponse, PermitRenewalRequest } from './permitService';
export type { 
  PaymentProcessingRequest, 
  PaymentProcessingResponse, 
  RefundRequest, 
  RefundResponse 
} from './paymentService';
export type {
  InsuranceProductSearchParams,
  InsurancePolicyCreateRequest,
  InsuranceClaimCreateRequest,
  CoverageGapAnalysis,
  PremiumCalculationRequest,
  PremiumCalculationResponse
} from './insuranceService';