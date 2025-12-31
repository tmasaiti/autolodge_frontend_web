/**
 * Cross-Border Permit Service
 * Handles API calls for permit management, applications, and document handling
 */

import { api } from './api';
import { CrossBorderPermit, PermitRequirement, PermitApplication } from '../components/booking/CrossBorderPermitManagement';
import { SADCCountryCode } from '../schemas/common-schemas';

export interface PermitSearchFilters {
  status?: CrossBorderPermit['status'][];
  from_country?: SADCCountryCode;
  to_country?: SADCCountryCode;
  expiring_within_days?: number;
  date_range?: {
    start_date: string;
    end_date: string;
  };
}

export interface PermitStatusUpdate {
  permit_id: number;
  status: CrossBorderPermit['status'];
  processing_notes?: string;
  rejection_reason?: string;
  estimated_completion?: string;
  document_url?: string;
}

export interface DocumentUploadResponse {
  document_url: string;
  document_id: string;
  verification_status: 'pending' | 'verified' | 'rejected';
}

export interface PermitRenewalRequest {
  permit_id: number;
  new_expiry_date: string;
  urgent_processing?: boolean;
  additional_documents?: string[];
}

class PermitService {
  private baseUrl = '/api/permits';

  /**
   * Get all permits for the current user
   */
  async getPermits(filters?: PermitSearchFilters): Promise<CrossBorderPermit[]> {
    const params = new URLSearchParams();
    
    if (filters) {
      if (filters.status?.length) {
        params.append('status', filters.status.join(','));
      }
      if (filters.from_country) {
        params.append('from_country', filters.from_country);
      }
      if (filters.to_country) {
        params.append('to_country', filters.to_country);
      }
      if (filters.expiring_within_days) {
        params.append('expiring_within_days', filters.expiring_within_days.toString());
      }
      if (filters.date_range) {
        params.append('start_date', filters.date_range.start_date);
        params.append('end_date', filters.date_range.end_date);
      }
    }

    const queryString = params.toString();
    const url = queryString ? `${this.baseUrl}?${queryString}` : this.baseUrl;
    
    const response = await api.get<CrossBorderPermit[]>(url);
    return response.data;
  }

  /**
   * Get a specific permit by ID
   */
  async getPermit(permitId: number): Promise<CrossBorderPermit> {
    const response = await api.get<CrossBorderPermit>(`${this.baseUrl}/${permitId}`);
    return response.data;
  }

  /**
   * Get permit requirements for specific countries
   */
  async getPermitRequirements(
    fromCountry: SADCCountryCode,
    toCountries: SADCCountryCode[]
  ): Promise<PermitRequirement[]> {
    const response = await api.get<PermitRequirement[]>(`${this.baseUrl}/requirements`, {
      params: {
        from_country: fromCountry,
        to_countries: toCountries.join(',')
      }
    });
    return response.data;
  }

  /**
   * Submit a new permit application
   */
  async submitApplication(application: PermitApplication): Promise<CrossBorderPermit> {
    const response = await api.post<CrossBorderPermit>(`${this.baseUrl}/applications`, application);
    return response.data;
  }

  /**
   * Update an existing permit application
   */
  async updateApplication(
    applicationId: number, 
    updates: Partial<PermitApplication>
  ): Promise<CrossBorderPermit> {
    const response = await api.patch<CrossBorderPermit>(
      `${this.baseUrl}/applications/${applicationId}`, 
      updates
    );
    return response.data;
  }

  /**
   * Cancel a permit application or permit
   */
  async cancelPermit(permitId: number, reason?: string): Promise<void> {
    await api.post(`${this.baseUrl}/${permitId}/cancel`, { reason });
  }

  /**
   * Renew an expired permit
   */
  async renewPermit(renewalRequest: PermitRenewalRequest): Promise<CrossBorderPermit> {
    const response = await api.post<CrossBorderPermit>(
      `${this.baseUrl}/${renewalRequest.permit_id}/renew`,
      renewalRequest
    );
    return response.data;
  }

  /**
   * Refresh permit status from external system
   */
  async refreshPermitStatus(permitId: number): Promise<CrossBorderPermit> {
    const response = await api.post<CrossBorderPermit>(`${this.baseUrl}/${permitId}/refresh`);
    return response.data;
  }

  /**
   * Upload document for a permit
   */
  async uploadDocument(
    permitId: number,
    file: File,
    documentType: string,
    description?: string
  ): Promise<DocumentUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('document_type', documentType);
    if (description) {
      formData.append('description', description);
    }

    const response = await api.post<DocumentUploadResponse>(
      `${this.baseUrl}/${permitId}/documents`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  }

  /**
   * Get documents for a permit
   */
  async getPermitDocuments(permitId: number) {
    const response = await api.get(`${this.baseUrl}/${permitId}/documents`);
    return response.data as {
      document_type: string;
      document_url: string;
      upload_date: string;
      verification_status: 'pending' | 'verified' | 'rejected';
      description?: string;
    }[];
  }

  /**
   * Delete a document
   */
  async deleteDocument(permitId: number, documentId: string): Promise<void> {
    await api.delete(`${this.baseUrl}/${permitId}/documents/${documentId}`);
  }

  /**
   * Get permit processing status and timeline
   */
  async getPermitTimeline(permitId: number) {
    const response = await api.get(`${this.baseUrl}/${permitId}/timeline`);
    return response.data as {
      id: string;
      timestamp: string;
      status: CrossBorderPermit['status'];
      description: string;
      notes?: string;
      performed_by: string;
    }[];
  }

  /**
   * Get permit statistics for dashboard
   */
  async getPermitStatistics() {
    const response = await api.get(`${this.baseUrl}/statistics`);
    return response.data as {
      total_permits: number;
      active_permits: number;
      processing_permits: number;
      expired_permits: number;
      expiring_soon: number;
      success_rate: number;
      average_processing_days: number;
      total_fees_paid: number;
      currency: string;
    };
  }

  /**
   * Check permit requirements for a specific route
   */
  async checkRouteRequirements(
    fromCountry: SADCCountryCode,
    toCountries: SADCCountryCode[],
    vehicleType: string,
    travelDates: { start_date: string; end_date: string }
  ) {
    const response = await api.post(`${this.baseUrl}/check-requirements`, {
      from_country: fromCountry,
      to_countries: toCountries,
      vehicle_type: vehicleType,
      travel_dates: travelDates
    });
    return response.data as {
      permits_required: boolean;
      requirements: PermitRequirement[];
      estimated_total_cost: number;
      estimated_processing_days: number;
      currency: string;
      warnings: string[];
      recommendations: string[];
    };
  }

  /**
   * Get available border crossing points
   */
  async getBorderCrossingPoints(
    fromCountry: SADCCountryCode,
    toCountry: SADCCountryCode
  ) {
    const response = await api.get(`${this.baseUrl}/border-crossings`, {
      params: {
        from_country: fromCountry,
        to_country: toCountry
      }
    });
    return response.data as {
      crossing_point_id: string;
      name: string;
      from_country: SADCCountryCode;
      to_country: SADCCountryCode;
      operating_hours: string;
      services_available: string[];
      estimated_crossing_time: string;
      coordinates: {
        latitude: number;
        longitude: number;
      };
      restrictions: string[];
    }[];
  }

  /**
   * Validate permit application data
   */
  async validateApplication(application: Partial<PermitApplication>) {
    const response = await api.post(`${this.baseUrl}/validate-application`, application);
    return response.data as {
      valid: boolean;
      errors: {
        field: string;
        message: string;
        code: string;
      }[];
      warnings: {
        field: string;
        message: string;
        code: string;
      }[];
    };
  }

  /**
   * Get permit fees breakdown
   */
  async getFeesBreakdown(
    requirementId: string,
    urgentProcessing: boolean = false
  ) {
    const response = await api.get(`${this.baseUrl}/fees/${requirementId}`, {
      params: { urgent_processing: urgentProcessing }
    });
    return response.data as {
      base_fee: number;
      processing_fee: number;
      urgent_fee: number;
      service_fee: number;
      taxes: {
        tax_type: string;
        rate: number;
        amount: number;
      }[];
      total_amount: number;
      currency: string;
    };
  }

  /**
   * Submit permit payment
   */
  async submitPayment(
    permitId: number,
    paymentMethod: string,
    paymentDetails: any
  ) {
    const response = await api.post(`${this.baseUrl}/${permitId}/payment`, {
      payment_method: paymentMethod,
      payment_details: paymentDetails
    });
    return response.data as {
      payment_id: string;
      status: 'pending' | 'completed' | 'failed';
      amount: number;
      currency: string;
      transaction_id?: string;
    };
  }

  /**
   * Get permit notifications/alerts
   */
  async getPermitNotifications() {
    const response = await api.get(`${this.baseUrl}/notifications`);
    return response.data as {
      id: string;
      permit_id: number;
      type: 'expiring_soon' | 'renewal_available' | 'status_update' | 'document_required';
      title: string;
      message: string;
      priority: 'low' | 'medium' | 'high' | 'urgent';
      created_at: string;
      read: boolean;
      action_required: boolean;
      action_url?: string;
    }[];
  }

  /**
   * Mark notification as read
   */
  async markNotificationRead(notificationId: string): Promise<void> {
    await api.patch(`${this.baseUrl}/notifications/${notificationId}/read`);
  }

  /**
   * Get permit templates for different countries
   */
  async getPermitTemplates(countryCode: SADCCountryCode) {
    const response = await api.get(`${this.baseUrl}/templates/${countryCode}`);
    return response.data as {
      template_id: string;
      country_code: SADCCountryCode;
      permit_type: string;
      template_url: string;
      instructions: string[];
      required_fields: {
        field_name: string;
        field_type: string;
        required: boolean;
        validation_rules: string[];
      }[];
    }[];
  }
}

export const permitService = new PermitService();
export default permitService;