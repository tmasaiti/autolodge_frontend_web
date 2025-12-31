/**
 * Compliance-related JSON schemas
 * Maps to compliance_checks.requirements, compliance_checks.violations, 
 * compliance_reports.data, and regulatory_rules.rule_data JSON fields
 */

import { JSONSchemaType } from 'ajv';
import { SADCCountryCode, sadcCountrySchema } from './common-schemas';

// Compliance requirements schema - maps to compliance_checks.requirements JSON field
export interface ComplianceRequirements {
  kyc_requirements: {
    identity_verification: boolean;
    address_verification: boolean;
    income_verification: boolean;
    document_types: string[];
    minimum_verification_level: 'basic' | 'standard' | 'premium';
  };
  tax_requirements: {
    tax_registration_required: boolean;
    vat_registration_required: boolean;
    tax_reporting_frequency: 'monthly' | 'quarterly' | 'annually';
    required_tax_documents: string[];
  };
  licensing_requirements: {
    business_license_required: boolean;
    vehicle_operator_license_required: boolean;
    insurance_requirements: string[];
    minimum_insurance_coverage: number;
  };
  cross_border_requirements: {
    permits_required: boolean;
    customs_declarations: boolean;
    additional_insurance: boolean;
    restricted_countries: SADCCountryCode[];
  };
  data_protection: {
    gdpr_compliance: boolean;
    data_retention_days: number;
    consent_requirements: string[];
    privacy_policy_required: boolean;
  };
  financial_requirements: {
    escrow_account_required: boolean;
    minimum_capital: number;
    currency: string;
    audit_frequency: 'monthly' | 'quarterly' | 'annually';
  };
}

export const complianceRequirementsSchema: JSONSchemaType<ComplianceRequirements> = {
  type: 'object',
  properties: {
    kyc_requirements: {
      type: 'object',
      properties: {
        identity_verification: { type: 'boolean' },
        address_verification: { type: 'boolean' },
        income_verification: { type: 'boolean' },
        document_types: { type: 'array', items: { type: 'string' } },
        minimum_verification_level: { type: 'string', enum: ['basic', 'standard', 'premium'] }
      },
      required: ['identity_verification', 'address_verification', 'income_verification', 
                'document_types', 'minimum_verification_level'],
      additionalProperties: false
    },
    tax_requirements: {
      type: 'object',
      properties: {
        tax_registration_required: { type: 'boolean' },
        vat_registration_required: { type: 'boolean' },
        tax_reporting_frequency: { type: 'string', enum: ['monthly', 'quarterly', 'annually'] },
        required_tax_documents: { type: 'array', items: { type: 'string' } }
      },
      required: ['tax_registration_required', 'vat_registration_required', 
                'tax_reporting_frequency', 'required_tax_documents'],
      additionalProperties: false
    },
    licensing_requirements: {
      type: 'object',
      properties: {
        business_license_required: { type: 'boolean' },
        vehicle_operator_license_required: { type: 'boolean' },
        insurance_requirements: { type: 'array', items: { type: 'string' } },
        minimum_insurance_coverage: { type: 'number', minimum: 0 }
      },
      required: ['business_license_required', 'vehicle_operator_license_required', 
                'insurance_requirements', 'minimum_insurance_coverage'],
      additionalProperties: false
    },
    cross_border_requirements: {
      type: 'object',
      properties: {
        permits_required: { type: 'boolean' },
        customs_declarations: { type: 'boolean' },
        additional_insurance: { type: 'boolean' },
        restricted_countries: { type: 'array', items: sadcCountrySchema }
      },
      required: ['permits_required', 'customs_declarations', 'additional_insurance', 'restricted_countries'],
      additionalProperties: false
    },
    data_protection: {
      type: 'object',
      properties: {
        gdpr_compliance: { type: 'boolean' },
        data_retention_days: { type: 'number', minimum: 1 },
        consent_requirements: { type: 'array', items: { type: 'string' } },
        privacy_policy_required: { type: 'boolean' }
      },
      required: ['gdpr_compliance', 'data_retention_days', 'consent_requirements', 'privacy_policy_required'],
      additionalProperties: false
    },
    financial_requirements: {
      type: 'object',
      properties: {
        escrow_account_required: { type: 'boolean' },
        minimum_capital: { type: 'number', minimum: 0 },
        currency: { type: 'string', pattern: '^[A-Z]{3}$' },
        audit_frequency: { type: 'string', enum: ['monthly', 'quarterly', 'annually'] }
      },
      required: ['escrow_account_required', 'minimum_capital', 'currency', 'audit_frequency'],
      additionalProperties: false
    }
  },
  required: ['kyc_requirements', 'tax_requirements', 'licensing_requirements', 
            'cross_border_requirements', 'data_protection', 'financial_requirements'],
  additionalProperties: false
};

// Compliance violations schema - maps to compliance_checks.violations JSON field
export interface ComplianceViolations {
  violations: {
    violation_id: string;
    violation_type: 'kyc' | 'tax' | 'licensing' | 'cross_border' | 'data_protection' | 'financial';
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    detected_at: string;
    deadline_for_resolution: string;
    resolution_steps: string[];
    penalty_amount?: number;
    penalty_currency?: string;
    status: 'open' | 'in_progress' | 'resolved' | 'escalated';
  }[];
  summary: {
    total_violations: number;
    critical_violations: number;
    overdue_violations: number;
    compliance_score: number;
  };
  remediation_plan: {
    priority_actions: string[];
    estimated_resolution_time: number;
    required_resources: string[];
    compliance_officer_assigned?: string;
  };
}

export const complianceViolationsSchema: JSONSchemaType<ComplianceViolations> = {
  type: 'object',
  properties: {
    violations: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          violation_id: { type: 'string' },
          violation_type: { type: 'string', enum: ['kyc', 'tax', 'licensing', 'cross_border', 'data_protection', 'financial'] },
          severity: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
          description: { type: 'string' },
          detected_at: { type: 'string', format: 'date-time' },
          deadline_for_resolution: { type: 'string', format: 'date-time' },
          resolution_steps: { type: 'array', items: { type: 'string' } },
          penalty_amount: { type: 'number', minimum: 0, nullable: true },
          penalty_currency: { type: 'string', pattern: '^[A-Z]{3}$', nullable: true },
          status: { type: 'string', enum: ['open', 'in_progress', 'resolved', 'escalated'] }
        },
        required: ['violation_id', 'violation_type', 'severity', 'description', 'detected_at', 
                  'deadline_for_resolution', 'resolution_steps', 'status'],
        additionalProperties: false
      }
    },
    summary: {
      type: 'object',
      properties: {
        total_violations: { type: 'number', minimum: 0 },
        critical_violations: { type: 'number', minimum: 0 },
        overdue_violations: { type: 'number', minimum: 0 },
        compliance_score: { type: 'number', minimum: 0, maximum: 100 }
      },
      required: ['total_violations', 'critical_violations', 'overdue_violations', 'compliance_score'],
      additionalProperties: false
    },
    remediation_plan: {
      type: 'object',
      properties: {
        priority_actions: { type: 'array', items: { type: 'string' } },
        estimated_resolution_time: { type: 'number', minimum: 0 },
        required_resources: { type: 'array', items: { type: 'string' } },
        compliance_officer_assigned: { type: 'string', nullable: true }
      },
      required: ['priority_actions', 'estimated_resolution_time', 'required_resources'],
      additionalProperties: false
    }
  },
  required: ['violations', 'summary', 'remediation_plan'],
  additionalProperties: false
};

// Compliance report data schema - maps to compliance_reports.data JSON field
export interface ComplianceReportData {
  report_metadata: {
    report_id: string;
    report_type: 'tax_summary' | 'cross_border_activity' | 'compliance_violations' | 'regulatory_changes' | 'audit_trail';
    generated_by: string;
    generation_timestamp: string;
    data_period: {
      start_date: string;
      end_date: string;
    };
    scope: {
      regions: SADCCountryCode[];
      entity_types: string[];
      compliance_areas: string[];
    };
  };
  executive_summary: {
    key_findings: string[];
    compliance_status: 'compliant' | 'non_compliant' | 'partially_compliant';
    risk_level: 'low' | 'medium' | 'high' | 'critical';
    recommendations: string[];
  };
  detailed_findings: {
    section: string;
    findings: {
      finding_id: string;
      description: string;
      evidence: string[];
      impact_level: 'low' | 'medium' | 'high' | 'critical';
      recommendations: string[];
    }[];
  }[];
  metrics: {
    compliance_scores: {
      area: string;
      score: number;
      trend: 'improving' | 'stable' | 'declining';
    }[];
    violation_statistics: {
      total_violations: number;
      violations_by_type: {
        type: string;
        count: number;
      }[];
      resolution_rates: {
        resolved: number;
        pending: number;
        overdue: number;
      };
    };
    financial_impact: {
      penalties_paid: number;
      compliance_costs: number;
      currency: string;
    };
  };
  appendices: {
    supporting_documents: string[];
    data_sources: string[];
    methodology: string;
    limitations: string[];
  };
}

export const complianceReportDataSchema: JSONSchemaType<ComplianceReportData> = {
  type: 'object',
  properties: {
    report_metadata: {
      type: 'object',
      properties: {
        report_id: { type: 'string' },
        report_type: { type: 'string', enum: ['tax_summary', 'cross_border_activity', 'compliance_violations', 'regulatory_changes', 'audit_trail'] },
        generated_by: { type: 'string' },
        generation_timestamp: { type: 'string', format: 'date-time' },
        data_period: {
          type: 'object',
          properties: {
            start_date: { type: 'string', format: 'date' },
            end_date: { type: 'string', format: 'date' }
          },
          required: ['start_date', 'end_date'],
          additionalProperties: false
        },
        scope: {
          type: 'object',
          properties: {
            regions: { type: 'array', items: sadcCountrySchema },
            entity_types: { type: 'array', items: { type: 'string' } },
            compliance_areas: { type: 'array', items: { type: 'string' } }
          },
          required: ['regions', 'entity_types', 'compliance_areas'],
          additionalProperties: false
        }
      },
      required: ['report_id', 'report_type', 'generated_by', 'generation_timestamp', 'data_period', 'scope'],
      additionalProperties: false
    },
    executive_summary: {
      type: 'object',
      properties: {
        key_findings: { type: 'array', items: { type: 'string' } },
        compliance_status: { type: 'string', enum: ['compliant', 'non_compliant', 'partially_compliant'] },
        risk_level: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
        recommendations: { type: 'array', items: { type: 'string' } }
      },
      required: ['key_findings', 'compliance_status', 'risk_level', 'recommendations'],
      additionalProperties: false
    },
    detailed_findings: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          section: { type: 'string' },
          findings: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                finding_id: { type: 'string' },
                description: { type: 'string' },
                evidence: { type: 'array', items: { type: 'string' } },
                impact_level: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
                recommendations: { type: 'array', items: { type: 'string' } }
              },
              required: ['finding_id', 'description', 'evidence', 'impact_level', 'recommendations'],
              additionalProperties: false
            }
          }
        },
        required: ['section', 'findings'],
        additionalProperties: false
      }
    },
    metrics: {
      type: 'object',
      properties: {
        compliance_scores: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              area: { type: 'string' },
              score: { type: 'number', minimum: 0, maximum: 100 },
              trend: { type: 'string', enum: ['improving', 'stable', 'declining'] }
            },
            required: ['area', 'score', 'trend'],
            additionalProperties: false
          }
        },
        violation_statistics: {
          type: 'object',
          properties: {
            total_violations: { type: 'number', minimum: 0 },
            violations_by_type: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  type: { type: 'string' },
                  count: { type: 'number', minimum: 0 }
                },
                required: ['type', 'count'],
                additionalProperties: false
              }
            },
            resolution_rates: {
              type: 'object',
              properties: {
                resolved: { type: 'number', minimum: 0 },
                pending: { type: 'number', minimum: 0 },
                overdue: { type: 'number', minimum: 0 }
              },
              required: ['resolved', 'pending', 'overdue'],
              additionalProperties: false
            }
          },
          required: ['total_violations', 'violations_by_type', 'resolution_rates'],
          additionalProperties: false
        },
        financial_impact: {
          type: 'object',
          properties: {
            penalties_paid: { type: 'number', minimum: 0 },
            compliance_costs: { type: 'number', minimum: 0 },
            currency: { type: 'string', pattern: '^[A-Z]{3}$' }
          },
          required: ['penalties_paid', 'compliance_costs', 'currency'],
          additionalProperties: false
        }
      },
      required: ['compliance_scores', 'violation_statistics', 'financial_impact'],
      additionalProperties: false
    },
    appendices: {
      type: 'object',
      properties: {
        supporting_documents: { type: 'array', items: { type: 'string' } },
        data_sources: { type: 'array', items: { type: 'string' } },
        methodology: { type: 'string' },
        limitations: { type: 'array', items: { type: 'string' } }
      },
      required: ['supporting_documents', 'data_sources', 'methodology', 'limitations'],
      additionalProperties: false
    }
  },
  required: ['report_metadata', 'executive_summary', 'detailed_findings', 'metrics', 'appendices'],
  additionalProperties: false
};