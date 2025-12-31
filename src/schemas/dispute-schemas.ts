/**
 * Dispute-related JSON schemas
 * Maps to disputes.evidence, dispute_evidence.metadata, and dispute_patterns.pattern_data JSON fields
 */

import { JSONSchemaType } from 'ajv';

// Core dispute types and enums
export enum DisputeType {
  DAMAGE_CLAIM = 'damage_claim',
  BILLING_DISPUTE = 'billing_dispute',
  SERVICE_ISSUE = 'service_issue',
  CANCELLATION_DISPUTE = 'cancellation_dispute',
  INSURANCE_CLAIM = 'insurance_claim',
  REFUND_REQUEST = 'refund_request',
  POLICY_VIOLATION = 'policy_violation',
  OTHER = 'other'
}

export enum DisputeStatus {
  OPEN = 'open',
  UNDER_REVIEW = 'under_review',
  AWAITING_EVIDENCE = 'awaiting_evidence',
  RESOLVED = 'resolved',
  CLOSED = 'closed'
}

export enum DisputeResolution {
  FULL_REFUND = 'full_refund',
  PARTIAL_REFUND = 'partial_refund',
  NO_REFUND = 'no_refund',
  REPAIR_COMPENSATION = 'repair_compensation',
  SERVICE_CREDIT = 'service_credit',
  POLICY_UPDATE = 'policy_update',
  NO_ACTION = 'no_action'
}

export interface Dispute {
  id: number;
  booking_id: number;
  raised_by: number;
  type: DisputeType;
  status: DisputeStatus;
  title: string;
  description: string;
  amount_disputed?: number;
  currency?: string;
  resolution?: DisputeResolution;
  resolution_amount?: number;
  resolution_notes?: string;
  evidence: DisputeEvidenceData;
  created_at: string;
  updated_at: string;
  resolved_at?: string;
}

export interface DisputeEvidence {
  id: number;
  dispute_id: number;
  type: 'photo' | 'document' | 'video' | 'text';
  url?: string;
  content?: string;
  description?: string;
  uploaded_by: number;
  metadata: DisputeEvidenceMetadata;
  created_at: string;
}

export interface DisputeComment {
  id: number;
  dispute_id: number;
  user_id: number;
  content: string;
  is_internal: boolean;
  created_at: string;
}

export interface DisputeStatistics {
  total: number;
  by_status: Record<DisputeStatus, number>;
  by_type: Record<DisputeType, number>;
  resolution_breakdown?: Record<DisputeResolution, number>;
  typeBreakdown?: Record<string, number>;
  average_resolution_time: number;
  total_disputed_amount: number;
  total_resolved_amount: number;
}

export interface DisputeSearchFilters {
  status?: DisputeStatus[];
  type?: DisputeType[];
  raisedBy?: number[];
  dateRange?: {
    start: string;
    end: string;
  };
  amountRange?: {
    min: number;
    max: number;
  };
}

export interface DisputeRequest {
  booking_id: number;
  type: DisputeType;
  title: string;
  description: string;
  amount_disputed?: number;
  currency?: string;
  evidence: File[];
}

export interface DisputeEvidenceUpload {
  file: File;
  type: 'photo' | 'document' | 'video';
  description?: string;
}

export interface DisputeResolutionRequest {
  resolution: DisputeResolution;
  resolution_amount?: number;
  resolution_notes?: string;
}

// Dispute evidence schema - maps to disputes.evidence JSON field
export interface DisputeEvidenceData {
  photos: {
    url: string;
    description?: string;
    timestamp: string;
    location?: {
      latitude: number;
      longitude: number;
    };
  }[];
  documents: {
    url: string;
    type: 'receipt' | 'invoice' | 'contract' | 'inspection_report' | 'police_report' | 'other';
    description?: string;
    uploaded_at: string;
  }[];
  videos: {
    url: string;
    description?: string;
    duration_seconds: number;
    timestamp: string;
  }[];
  text_statements: {
    statement: string;
    submitted_at: string;
    witness_name?: string;
    witness_contact?: string;
  }[];
  timeline: {
    event: string;
    timestamp: string;
    description: string;
  }[];
}

export const disputeEvidenceDataSchema: JSONSchemaType<DisputeEvidenceData> = {
  type: 'object',
  properties: {
    photos: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          url: { type: 'string', format: 'uri' },
          description: { type: 'string', nullable: true },
          timestamp: { type: 'string', format: 'date-time' },
          location: {
            type: 'object',
            properties: {
              latitude: { type: 'number', minimum: -90, maximum: 90 },
              longitude: { type: 'number', minimum: -180, maximum: 180 }
            },
            required: ['latitude', 'longitude'],
            additionalProperties: false,
            nullable: true
          }
        },
        required: ['url', 'timestamp'],
        additionalProperties: false
      }
    },
    documents: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          url: { type: 'string', format: 'uri' },
          type: { type: 'string', enum: ['receipt', 'invoice', 'contract', 'inspection_report', 'police_report', 'other'] },
          description: { type: 'string', nullable: true },
          uploaded_at: { type: 'string', format: 'date-time' }
        },
        required: ['url', 'type', 'uploaded_at'],
        additionalProperties: false
      }
    },
    videos: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          url: { type: 'string', format: 'uri' },
          description: { type: 'string', nullable: true },
          duration_seconds: { type: 'number', minimum: 0 },
          timestamp: { type: 'string', format: 'date-time' }
        },
        required: ['url', 'duration_seconds', 'timestamp'],
        additionalProperties: false
      }
    },
    text_statements: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          statement: { type: 'string', minLength: 1 },
          submitted_at: { type: 'string', format: 'date-time' },
          witness_name: { type: 'string', nullable: true },
          witness_contact: { type: 'string', nullable: true }
        },
        required: ['statement', 'submitted_at'],
        additionalProperties: false
      }
    },
    timeline: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          event: { type: 'string' },
          timestamp: { type: 'string', format: 'date-time' },
          description: { type: 'string' }
        },
        required: ['event', 'timestamp', 'description'],
        additionalProperties: false
      }
    }
  },
  required: ['photos', 'documents', 'videos', 'text_statements', 'timeline'],
  additionalProperties: false
};

// Dispute evidence metadata schema - maps to dispute_evidence.metadata JSON field
export interface DisputeEvidenceMetadata {
  file_size: number;
  file_type: string;
  checksum: string;
  upload_source: 'web' | 'mobile' | 'api';
  device_info?: {
    user_agent: string;
    platform: string;
    screen_resolution?: string;
  };
  geolocation?: {
    latitude: number;
    longitude: number;
    accuracy: number;
    timestamp: string;
  };
  exif_data?: {
    camera_make?: string;
    camera_model?: string;
    date_taken?: string;
    gps_coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  verification_status: 'pending' | 'verified' | 'rejected' | 'tampered';
  verification_details?: {
    verified_by: number;
    verified_at: string;
    verification_method: string;
    confidence_score: number;
  };
}

export const disputeEvidenceMetadataSchema: JSONSchemaType<DisputeEvidenceMetadata> = {
  type: 'object',
  properties: {
    file_size: { type: 'number', minimum: 0 },
    file_type: { type: 'string' },
    checksum: { type: 'string' },
    upload_source: { type: 'string', enum: ['web', 'mobile', 'api'] },
    device_info: {
      type: 'object',
      properties: {
        user_agent: { type: 'string' },
        platform: { type: 'string' },
        screen_resolution: { type: 'string', nullable: true }
      },
      required: ['user_agent', 'platform'],
      additionalProperties: false,
      nullable: true
    },
    geolocation: {
      type: 'object',
      properties: {
        latitude: { type: 'number', minimum: -90, maximum: 90 },
        longitude: { type: 'number', minimum: -180, maximum: 180 },
        accuracy: { type: 'number', minimum: 0 },
        timestamp: { type: 'string', format: 'date-time' }
      },
      required: ['latitude', 'longitude', 'accuracy', 'timestamp'],
      additionalProperties: false,
      nullable: true
    },
    exif_data: {
      type: 'object',
      properties: {
        camera_make: { type: 'string', nullable: true },
        camera_model: { type: 'string', nullable: true },
        date_taken: { type: 'string', format: 'date-time', nullable: true },
        gps_coordinates: {
          type: 'object',
          properties: {
            latitude: { type: 'number', minimum: -90, maximum: 90 },
            longitude: { type: 'number', minimum: -180, maximum: 180 }
          },
          required: ['latitude', 'longitude'],
          additionalProperties: false,
          nullable: true
        }
      },
      required: [],
      additionalProperties: false,
      nullable: true
    },
    verification_status: { type: 'string', enum: ['pending', 'verified', 'rejected', 'tampered'] },
    verification_details: {
      type: 'object',
      properties: {
        verified_by: { type: 'number' },
        verified_at: { type: 'string', format: 'date-time' },
        verification_method: { type: 'string' },
        confidence_score: { type: 'number', minimum: 0, maximum: 1 }
      },
      required: ['verified_by', 'verified_at', 'verification_method', 'confidence_score'],
      additionalProperties: false,
      nullable: true
    }
  },
  required: ['file_size', 'file_type', 'checksum', 'upload_source', 'verification_status'],
  additionalProperties: false
};

// Dispute pattern data schema - maps to dispute_patterns.pattern_data JSON field
export interface DisputePatternData {
  pattern_type: 'frequent_disputes' | 'high_value_disputes' | 'similar_complaints' | 
                'timing_pattern' | 'geographic_pattern';
  frequency_data?: {
    dispute_count: number;
    time_period_days: number;
    average_dispute_value: number;
    dispute_types: string[];
  };
  geographic_data?: {
    locations: {
      latitude: number;
      longitude: number;
      dispute_count: number;
    }[];
    radius_km: number;
    concentration_score: number;
  };
  timing_data?: {
    time_patterns: {
      hour_of_day: number;
      day_of_week: number;
      frequency: number;
    }[];
    seasonal_patterns: {
      month: number;
      frequency: number;
    }[];
  };
  similarity_data?: {
    common_keywords: string[];
    similar_disputes: {
      dispute_id: number;
      similarity_score: number;
      matching_elements: string[];
    }[];
  };
  risk_indicators: {
    indicator: string;
    weight: number;
    description: string;
  }[];
  confidence_metrics: {
    data_quality_score: number;
    sample_size: number;
    statistical_significance: number;
  };
}

export const disputePatternDataSchema: JSONSchemaType<DisputePatternData> = {
  type: 'object',
  properties: {
    pattern_type: { type: 'string', enum: ['frequent_disputes', 'high_value_disputes', 'similar_complaints', 'timing_pattern', 'geographic_pattern'] },
    frequency_data: {
      type: 'object',
      properties: {
        dispute_count: { type: 'number', minimum: 0 },
        time_period_days: { type: 'number', minimum: 1 },
        average_dispute_value: { type: 'number', minimum: 0 },
        dispute_types: { type: 'array', items: { type: 'string' } }
      },
      required: ['dispute_count', 'time_period_days', 'average_dispute_value', 'dispute_types'],
      additionalProperties: false,
      nullable: true
    },
    geographic_data: {
      type: 'object',
      properties: {
        locations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              latitude: { type: 'number', minimum: -90, maximum: 90 },
              longitude: { type: 'number', minimum: -180, maximum: 180 },
              dispute_count: { type: 'number', minimum: 0 }
            },
            required: ['latitude', 'longitude', 'dispute_count'],
            additionalProperties: false
          }
        },
        radius_km: { type: 'number', minimum: 0 },
        concentration_score: { type: 'number', minimum: 0, maximum: 1 }
      },
      required: ['locations', 'radius_km', 'concentration_score'],
      additionalProperties: false,
      nullable: true
    },
    timing_data: {
      type: 'object',
      properties: {
        time_patterns: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              hour_of_day: { type: 'number', minimum: 0, maximum: 23 },
              day_of_week: { type: 'number', minimum: 0, maximum: 6 },
              frequency: { type: 'number', minimum: 0 }
            },
            required: ['hour_of_day', 'day_of_week', 'frequency'],
            additionalProperties: false
          }
        },
        seasonal_patterns: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              month: { type: 'number', minimum: 1, maximum: 12 },
              frequency: { type: 'number', minimum: 0 }
            },
            required: ['month', 'frequency'],
            additionalProperties: false
          }
        }
      },
      required: ['time_patterns', 'seasonal_patterns'],
      additionalProperties: false,
      nullable: true
    },
    similarity_data: {
      type: 'object',
      properties: {
        common_keywords: { type: 'array', items: { type: 'string' } },
        similar_disputes: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              dispute_id: { type: 'number' },
              similarity_score: { type: 'number', minimum: 0, maximum: 1 },
              matching_elements: { type: 'array', items: { type: 'string' } }
            },
            required: ['dispute_id', 'similarity_score', 'matching_elements'],
            additionalProperties: false
          }
        }
      },
      required: ['common_keywords', 'similar_disputes'],
      additionalProperties: false,
      nullable: true
    },
    risk_indicators: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          indicator: { type: 'string' },
          weight: { type: 'number', minimum: 0, maximum: 1 },
          description: { type: 'string' }
        },
        required: ['indicator', 'weight', 'description'],
        additionalProperties: false
      }
    },
    confidence_metrics: {
      type: 'object',
      properties: {
        data_quality_score: { type: 'number', minimum: 0, maximum: 1 },
        sample_size: { type: 'number', minimum: 0 },
        statistical_significance: { type: 'number', minimum: 0, maximum: 1 }
      },
      required: ['data_quality_score', 'sample_size', 'statistical_significance'],
      additionalProperties: false
    }
  },
  required: ['pattern_type', 'risk_indicators', 'confidence_metrics'],
  additionalProperties: false
};