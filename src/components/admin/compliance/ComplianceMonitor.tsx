/**
 * Compliance Monitor Component
 * Main compliance monitoring dashboard for administrators
 */

import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  FileText, 
  Users, 
  Car,
  TrendingUp,
  Download,
  RefreshCw
} from 'lucide-react';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';

interface ComplianceMetrics {
  overallScore: number;
  operatorCompliance: number;
  vehicleCompliance: number;
  documentCompliance: number;
  kycCompliance: number;
  insuranceCompliance: number;
  crossBorderCompliance: number;
}

interface ComplianceAlert {
  id: string;
  type: 'license_expiry' | 'insurance_expiry' | 'document_missing' | 'kyc_incomplete' | 'regulatory_change';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  entity: string;
  entityType: 'operator' | 'vehicle' | 'user';
  dueDate?: string;
  createdAt: string;
  status: 'open' | 'acknowledged' | 'resolved';
}

interface RegulatoryRule {
  id: string;
  name: string;
  description: string;
  category: 'sadc' | 'local' | 'insurance' | 'tax' | 'safety';
  country: string;
  status: 'active' | 'pending' | 'deprecated';
  effectiveDate: string;
  lastUpdated: string;
  complianceRate: number;
}

export function ComplianceMonitor() {
  const [metrics, setMetrics] = useState<ComplianceMetrics>({
    overallScore: 0,
    operatorCompliance: 0,
    vehicleCompliance: 0,
    documentCompliance: 0,
    kycCompliance: 0,
    insuranceCompliance: 0,
    crossBorderCompliance: 0
  });

  const [alerts, setAlerts] = useState<ComplianceAlert[]>([]);
  const [rules, setRules] = useState<RegulatoryRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'alerts' | 'rules' | 'reports'>('overview');

  useEffect(() => {
    loadComplianceData();
  }, []);

  const loadComplianceData = async () => {
    try {
      setLoading(true);
      
      // Simulate API calls - replace with actual API calls
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock data - replace with actual API responses
      setMetrics({
        overallScore: 94,
        operatorCompliance: 96,
        vehicleCompliance: 92,
        documentCompliance: 89,
        kycCompliance: 97,
        insuranceCompliance: 91,
        crossBorderCompliance: 88
      });

      setAlerts([
        {
          id: '1',
          type: 'license_expiry',
          severity: 'high',
          title: 'Operator License Expiring',
          description: 'SafeDrive Rentals operator license expires in 15 days',
          entity: 'SafeDrive Rentals',
          entityType: 'operator',
          dueDate: '2024-02-01T00:00:00Z',
          createdAt: '2024-01-15T10:00:00Z',
          status: 'open'
        },
        {
          id: '2',
          type: 'insurance_expiry',
          severity: 'critical',
          title: 'Vehicle Insurance Expired',
          description: 'Toyota Camry (REG-123-ABC) insurance has expired',
          entity: 'Toyota Camry (REG-123-ABC)',
          entityType: 'vehicle',
          dueDate: '2024-01-10T00:00:00Z',
          createdAt: '2024-01-11T08:00:00Z',
          status: 'acknowledged'
        },
        {
          id: '3',
          type: 'document_missing',
          severity: 'medium',
          title: 'Missing KYC Documents',
          description: 'User john.doe@example.com missing proof of address',
          entity: 'john.doe@example.com',
          entityType: 'user',
          createdAt: '2024-01-14T14:30:00Z',
          status: 'open'
        }
      ]);

      setRules([
        {
          id: '1',
          name: 'SADC Cross-Border Vehicle Permit',
          description: 'Vehicles crossing SADC borders must have valid permits',
          category: 'sadc',
          country: 'Regional',
          status: 'active',
          effectiveDate: '2023-01-01T00:00:00Z',
          lastUpdated: '2024-01-01T00:00:00Z',
          complianceRate: 88
        },
        {
          id: '2',
          name: 'Operator Business License',
          description: 'All operators must maintain valid business licenses',
          category: 'local',
          country: 'South Africa',
          status: 'active',
          effectiveDate: '2022-06-01T00:00:00Z',
          lastUpdated: '2023-12-15T00:00:00Z',
          complianceRate: 96
        },
        {
          id: '3',
          name: 'Vehicle Insurance Requirements',
          description: 'Minimum insurance coverage requirements for rental vehicles',
          category: 'insurance',
          country: 'Botswana',
          status: 'active',
          effectiveDate: '2023-03-01T00:00:00Z',
          lastUpdated: '2024-01-10T00:00:00Z',
          complianceRate: 91
        }
      ]);
    } catch (error) {
      console.error('Failed to load compliance data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 95) return 'text-green-600';
    if (score >= 85) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 95) return 'bg-green-50';
    if (score >= 85) return 'bg-yellow-50';
    return 'bg-red-50';
  };

  const getSeverityColor = (severity: ComplianceAlert['severity']) => {
    switch (severity) {
      case 'critical':
        return 'text-red-700 bg-red-50 border-red-200';
      case 'high':
        return 'text-orange-700 bg-orange-50 border-orange-200';
      case 'medium':
        return 'text-yellow-700 bg-yellow-50 border-yellow-200';
      case 'low':
        return 'text-blue-700 bg-blue-50 border-blue-200';
      default:
        return 'text-gray-700 bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = (status: ComplianceAlert['status']) => {
    switch (status) {
      case 'resolved':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'acknowledged':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'open':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-500" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const generateReport = async () => {
    // Simulate report generation
    console.log('Generating compliance report...');
    // In a real app, this would trigger a report generation API call
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Compliance Monitoring</h1>
          <p className="text-gray-600 mt-2">
            Monitor regulatory compliance across the platform
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            onClick={loadComplianceData}
            className="flex items-center space-x-2"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Refresh</span>
          </Button>
          <Button
            onClick={generateReport}
            className="flex items-center space-x-2"
          >
            <Download className="h-4 w-4" />
            <span>Generate Report</span>
          </Button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', name: 'Overview', icon: Shield },
            { id: 'alerts', name: 'Alerts', icon: AlertTriangle },
            { id: 'rules', name: 'Rules', icon: FileText },
            { id: 'reports', name: 'Reports', icon: TrendingUp }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`
                  flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm
                  ${activeTab === tab.id
                    ? 'border-red-500 text-red-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.name}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Overall Score */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Overall Compliance Score</h2>
              <div className={`text-3xl font-bold ${getScoreColor(metrics.overallScore)}`}>
                {metrics.overallScore}%
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className={`h-3 rounded-full ${metrics.overallScore >= 95 ? 'bg-green-500' : metrics.overallScore >= 85 ? 'bg-yellow-500' : 'bg-red-500'}`}
                style={{ width: `${metrics.overallScore}%` }}
              ></div>
            </div>
          </Card>

          {/* Compliance Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { name: 'Operator Compliance', score: metrics.operatorCompliance, icon: Users },
              { name: 'Vehicle Compliance', score: metrics.vehicleCompliance, icon: Car },
              { name: 'Document Compliance', score: metrics.documentCompliance, icon: FileText },
              { name: 'KYC Compliance', score: metrics.kycCompliance, icon: Shield },
              { name: 'Insurance Compliance', score: metrics.insuranceCompliance, icon: Shield },
              { name: 'Cross-Border Compliance', score: metrics.crossBorderCompliance, icon: Shield }
            ].map((metric) => {
              const Icon = metric.icon;
              return (
                <Card key={metric.name} className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">{metric.name}</p>
                      <p className={`text-2xl font-bold ${getScoreColor(metric.score)}`}>
                        {metric.score}%
                      </p>
                    </div>
                    <div className={`p-3 rounded-full ${getScoreBgColor(metric.score)}`}>
                      <Icon className={`h-6 w-6 ${getScoreColor(metric.score)}`} />
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === 'alerts' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Compliance Alerts</h2>
            <div className="text-sm text-gray-600">
              {alerts.filter(a => a.status === 'open').length} open alerts
            </div>
          </div>
          
          {alerts.map((alert) => (
            <Card key={alert.id} className={`p-4 border-l-4 ${getSeverityColor(alert.severity)}`}>
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  {getStatusIcon(alert.status)}
                  <div>
                    <h3 className="font-medium text-gray-900">{alert.title}</h3>
                    <p className="text-sm text-gray-600 mt-1">{alert.description}</p>
                    <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                      <span>Entity: {alert.entity}</span>
                      <span>Type: {alert.entityType}</span>
                      <span>Created: {formatDate(alert.createdAt)}</span>
                      {alert.dueDate && <span>Due: {formatDate(alert.dueDate)}</span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(alert.severity)}`}>
                    {alert.severity}
                  </span>
                  <Button size="sm" variant="outline">
                    View Details
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {activeTab === 'rules' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Regulatory Rules</h2>
            <Button>Add New Rule</Button>
          </div>
          
          <div className="grid gap-4">
            {rules.map((rule) => (
              <Card key={rule.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="font-medium text-gray-900">{rule.name}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        rule.status === 'active' ? 'bg-green-100 text-green-800' :
                        rule.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {rule.status}
                      </span>
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {rule.category}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{rule.description}</p>
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <span>Country: {rule.country}</span>
                      <span>Effective: {formatDate(rule.effectiveDate)}</span>
                      <span>Updated: {formatDate(rule.lastUpdated)}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-lg font-bold ${getScoreColor(rule.complianceRate)}`}>
                      {rule.complianceRate}%
                    </div>
                    <div className="text-xs text-gray-500">Compliance Rate</div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'reports' && (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-gray-900">Compliance Reports</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="font-medium text-gray-900 mb-4">Monthly Compliance Report</h3>
              <p className="text-sm text-gray-600 mb-4">
                Comprehensive monthly compliance status across all operators and vehicles.
              </p>
              <Button onClick={generateReport} className="w-full">
                Generate Monthly Report
              </Button>
            </Card>
            
            <Card className="p-6">
              <h3 className="font-medium text-gray-900 mb-4">SADC Regulatory Report</h3>
              <p className="text-sm text-gray-600 mb-4">
                Cross-border compliance report for SADC regulatory authorities.
              </p>
              <Button onClick={generateReport} className="w-full">
                Generate SADC Report
              </Button>
            </Card>
            
            <Card className="p-6">
              <h3 className="font-medium text-gray-900 mb-4">Audit Trail Report</h3>
              <p className="text-sm text-gray-600 mb-4">
                Detailed audit trail of all compliance-related activities and decisions.
              </p>
              <Button onClick={generateReport} className="w-full">
                Generate Audit Report
              </Button>
            </Card>
            
            <Card className="p-6">
              <h3 className="font-medium text-gray-900 mb-4">Risk Assessment Report</h3>
              <p className="text-sm text-gray-600 mb-4">
                Risk analysis and compliance gap assessment across the platform.
              </p>
              <Button onClick={generateReport} className="w-full">
                Generate Risk Report
              </Button>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}