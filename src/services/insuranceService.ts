/**
 * Insurance Service
 * Handles API interactions for insurance products, policies, and claims
 */

import { api } from './api';
import { 
  InsuranceCoverageLimits,
  InsurancePremiumCalculation,
  InsurancePolicyCoverageDetails,
  InsuranceClaimData
} from '../schemas/insurance-schemas';

export interface InsuranceProduct {
  id: number;
  provider_id: number;
  name: string;
  coverage_type: 'basic' | 'comprehensive' | 'third_party' | 'collision' | 'theft';
  description: string;
  coverage_limits: InsuranceCoverageLimits;
  premium_calculation: InsurancePremiumCalculation;
  countries: string[];
  vehicle_categories: string[];
  provider: {
    id: number;
    name: string;
    rating: number;
    logo_url?: string;
  };
  features: string[];
  exclusions: string[];
  popular?: boolean;
  recommended?: boolean;
}

export interface InsurancePolicy {
  id: number;
  booking_id: number;
  product_id: number;
  policy_number: string;
  status: 'pending' | 'active' | 'expired' | 'cancelled' | 'claimed';
  coverage_details: InsurancePolicyCoverageDetails;
  premium_amount: number;
  currency: string;
  created_at: string;
  updated_at: string;
  product: {
    id: number;
    name: string;
    provider: {
      id: number;
      name: string;
      logo_url?: string;
    };
  };
  booking?: {
    id: number;
    vehicle: {
      make: string;
      model: string;
      year: number;
    };
    date_range: {
      start_date: string;
      end_date: string;
    };
  };
}

export interface InsuranceClaim {
  id: number;
  policy_id: number;
  booking_id: number;
  claim_type: 'damage' | 'theft' | 'accident' | 'liability' | 'medical' | 'other';
  status: 'submitted' | 'under_review' | 'approved' | 'rejected' | 'paid' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  title: string;
  description: string;
  claim_amount?: number;
  currency?: string;
  raised_by: 'renter' | 'operator';
  claim_data: InsuranceClaimData;
  created_at: string;
  updated_at: string;
}

export interface InsuranceProductSearchParams {
  vehicle_category?: string;
  countries?: string[];
  coverage_type?: 'basic' | 'comprehensive' | 'third_party' | 'collision' | 'theft';
  max_premium?: number;
  rental_duration_days?: number;
  renter_age?: number;
}

export interface InsurancePolicyCreateRequest {
  booking_id: number;
  product_id: number;
  coverage_details: InsurancePolicyCoverageDetails;
  premium_amount: number;
  currency: string;
}

export interface InsuranceClaimCreateRequest {
  policy_id: number;
  booking_id: number;
  claim_type: 'damage' | 'theft' | 'accident' | 'liability' | 'medical' | 'other';
  incident_date: string;
  claim_amount?: number;
  currency?: string;
  description: string;
  claim_data: InsuranceClaimData;
}

export interface CoverageGapAnalysis {
  gaps: {
    type: string;
    description: string;
    severity: 'low' | 'medium' | 'high';
    recommended_products: number[];
  }[];
  recommendations: {
    product_id: number;
    reason: string;
    priority: number;
  }[];
}

export interface PremiumCalculationRequest {
  product_id: number;
  vehicle_category: string;
  rental_duration_days: number;
  renter_age: number;
  countries: string[];
  pickup_date: string;
}

export interface PremiumCalculationResponse {
  base_premium: number;
  adjustments: {
    type: string;
    description: string;
    amount: number;
    multiplier?: number;
  }[];
  total_premium: number;
  currency: string;
  breakdown: {
    daily_rate: number;
    duration_discount: number;
    age_adjustment: number;
    location_adjustment: number;
    seasonal_adjustment: number;
    risk_adjustment: number;
  };
}

export interface InsuranceProductSearchParams {
  vehicle_category?: string;
  countries?: string[];
  coverage_type?: 'basic' | 'comprehensive' | 'third_party' | 'collision' | 'theft';
  max_premium?: number;
  rental_duration_days?: number;
  renter_age?: number;
}

class InsuranceService {
  /**
   * Get available insurance products based on search criteria
   */
  async getInsuranceProducts(params: InsuranceProductSearchParams = {}): Promise<InsuranceProduct[]> {
    const response = await api.get('/insurance/products', { params });
    return response.data as InsuranceProduct[];
  }

  /**
   * Get detailed information about a specific insurance product
   */
  async getInsuranceProduct(productId: number): Promise<InsuranceProduct> {
    const response = await api.get(`/insurance/products/${productId}`);
    return response.data as InsuranceProduct;
  }

  /**
   * Calculate premium for a specific product and booking details
   */
  async calculatePremium(request: PremiumCalculationRequest): Promise<PremiumCalculationResponse> {
    const response = await api.post('/insurance/calculate-premium', request);
    return response.data as PremiumCalculationResponse;
  }

  /**
   * Analyze coverage gaps for a booking and recommend products
   */
  async analyzeCoverageGaps(
    bookingId: number, 
    existingCoverage?: InsurancePolicyCoverageDetails[]
  ): Promise<CoverageGapAnalysis> {
    const response = await api.post('/insurance/analyze-coverage-gaps', {
      booking_id: bookingId,
      existing_coverage: existingCoverage
    });
    return response.data as CoverageGapAnalysis;
  }

  /**
   * Compare multiple insurance products side by side
   */
  async compareProducts(productIds: number[]): Promise<{
    products: InsuranceProduct[];
    comparison_matrix: {
      feature: string;
      products: Record<number, boolean | string | number>;
    }[];
  }> {
    const response = await api.post('/insurance/compare-products', {
      product_ids: productIds
    });
    return response.data as any;
  }

  /**
   * Create an insurance policy for a booking
   */
  async createPolicy(request: InsurancePolicyCreateRequest): Promise<InsurancePolicy> {
    const response = await api.post('/insurance/policies', request);
    return response.data as InsurancePolicy;
  }

  /**
   * Get insurance policies for a user or booking
   */
  async getPolicies(params: { 
    user_id?: number; 
    booking_id?: number; 
    status?: string 
  } = {}): Promise<InsurancePolicy[]> {
    const response = await api.get('/insurance/policies', { params });
    return response.data as InsurancePolicy[];
  }

  /**
   * Get detailed information about a specific policy
   */
  async getPolicy(policyId: number): Promise<InsurancePolicy> {
    const response = await api.get(`/insurance/policies/${policyId}`);
    return response.data as InsurancePolicy;
  }

  /**
   * Update policy status (activate, cancel, etc.)
   */
  async updatePolicyStatus(
    policyId: number, 
    status: 'pending' | 'active' | 'expired' | 'cancelled' | 'claimed',
    reason?: string
  ): Promise<InsurancePolicy> {
    const response = await api.patch(`/insurance/policies/${policyId}/status`, {
      status,
      reason
    });
    return response.data as InsurancePolicy;
  }

  /**
   * Create an insurance claim
   */
  async createClaim(request: InsuranceClaimCreateRequest): Promise<InsuranceClaim> {
    const response = await api.post('/insurance/claims', request);
    return response.data as InsuranceClaim;
  }

  /**
   * Get insurance claims for a user or policy
   */
  async getClaims(params: { 
    user_id?: number; 
    policy_id?: number; 
    status?: string 
  } = {}): Promise<InsuranceClaim[]> {
    const response = await api.get('/insurance/claims', { params });
    return response.data as InsuranceClaim[];
  }

  /**
   * Get detailed information about a specific claim
   */
  async getClaim(claimId: number): Promise<InsuranceClaim> {
    const response = await api.get(`/insurance/claims/${claimId}`);
    return response.data as InsuranceClaim;
  }

  /**
   * Update claim status
   */
  async updateClaimStatus(
    claimId: number,
    status: 'submitted' | 'under_review' | 'approved' | 'rejected' | 'paid' | 'closed',
    notes?: string
  ): Promise<InsuranceClaim> {
    const response = await api.patch(`/insurance/claims/${claimId}/status`, {
      status,
      notes
    });
    return response.data as InsuranceClaim;
  }

  /**
   * Upload supporting documents for a claim
   */
  async uploadClaimDocument(
    claimId: number,
    file: File,
    documentType: string,
    description?: string
  ): Promise<{ document_id: number; url: string }> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('document_type', documentType);
    if (description) {
      formData.append('description', description);
    }

    const response = await api.post(`/insurance/claims/${claimId}/documents`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data as { document_id: number; url: string };
  }

  /**
   * Get emergency assistance information for a policy
   */
  async getEmergencyAssistance(policyId: number): Promise<{
    hotline_numbers: {
      country: string;
      number: string;
      available_24_7: boolean;
    }[];
    services: {
      service: string;
      description: string;
      coverage_limit?: number;
      currency?: string;
    }[];
    nearest_providers: {
      type: 'hospital' | 'repair_shop' | 'towing' | 'rental_agency';
      name: string;
      address: string;
      phone: string;
      distance_km: number;
    }[];
  }> {
    const response = await api.get(`/insurance/policies/${policyId}/emergency-assistance`);
    return response.data as any;
  }

  /**
   * Request emergency assistance
   */
  async requestEmergencyAssistance(
    policyId: number,
    request: {
      assistance_type: 'roadside' | 'medical' | 'towing' | 'replacement_vehicle' | 'other';
      location: {
        latitude: number;
        longitude: number;
        address: string;
      };
      description: string;
      urgency: 'low' | 'medium' | 'high' | 'emergency';
      contact_number: string;
    }
  ): Promise<{
    request_id: number;
    estimated_arrival_time?: string;
    provider_contact: string;
    instructions: string[];
  }> {
    const response = await api.post(`/insurance/policies/${policyId}/emergency-assistance`, request);
    return response.data as any;
  }

  /**
   * Get insurance providers and their ratings
   */
  async getInsuranceProviders(): Promise<{
    id: number;
    name: string;
    rating: number;
    logo_url?: string;
    description: string;
    countries: string[];
    specialties: string[];
    contact_info: {
      phone: string;
      email: string;
      website?: string;
    };
  }[]> {
    const response = await api.get('/insurance/providers');
    return response.data as any;
  }

  /**
   * Get insurance statistics and analytics
   */
  async getInsuranceAnalytics(params: {
    user_id?: number;
    date_from?: string;
    date_to?: string;
  } = {}): Promise<{
    total_policies: number;
    active_policies: number;
    total_claims: number;
    claim_success_rate: number;
    average_claim_amount: number;
    most_common_claim_types: {
      type: string;
      count: number;
      percentage: number;
    }[];
    savings_from_insurance: number;
    currency: string;
  }> {
    const response = await api.get('/insurance/analytics', { params });
    return response.data as any;
  }
}

export const insuranceService = new InsuranceService();
export default insuranceService;