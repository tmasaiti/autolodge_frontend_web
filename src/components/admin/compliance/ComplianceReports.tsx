/**
 * Compliance Reports Component
 * Generate and manage compliance reports for regulatory authorities
 */

import React, { useState, useEffect } from 'react';
import { 
  Download, 
  Calendar, 
  FileText, 
  BarChart3, 
  Shield, 
  Globe,
  Users,
  Car,
  AlertTriangle,
  CheckCircle,
  Clock,
  Filter
} from 'lucide-react';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';

interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  type: 'monthly' | 'quarterly' | 'annual' | 'ad_hoc';
  category: 'sadc' | 'local' | 'audit' | 'risk' | 'performance';
  requiredBy: string[];
  lastGenerated?: string;
  nextDue?: string;
  status: 'current' | 'overdue' | 'upcoming';
}

interface GeneratedReport {
  id: string;
  templateId: string;
  name: string;
  generatedAt: string;
  period: {
    start: string;
    end: string;
  };
  status: 'generating' | 'completed' | 'failed';
  fileUrl?: string;
  fileSize?: number;
  generatedBy: string;
}

interface ComplianceMetrics {
  totalOperators: number;
  compliantOperators: number;
  totalVehicles: number;
  compliantVehicles: number;
  activeDisputes: number;
  resolvedDisputes: number;
  complianceScore: number;
  riskLevel: 'low' | 'medium' | 'high';
}

export function ComplianceReports() {
  const [reportTemplates, setReportTemplates] = useState<ReportTemplate[]>([]);
  const [generatedReports, setGeneratedReports] = useState<GeneratedReport[]>([]);
  const [metrics, setMetrics] = useState<ComplianceMetrics>({
    totalOperators: 0,
    compliantOperators: 0,
    totalVehicles: 0,
    compliantVehicles: 0,
    activeDisputes: 0,
    resolvedDisputes: 0,
    complianceScore: 0,
    riskLevel: 'low'
  });
  const [loading, setLoading] = useState(true);
  const [generatingReports, setGeneratingReports] = useState<Set<string>>(new Set());
  const [selectedPeriod, setSelectedPeriod] = useState('current_month');
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    loadReportData();
  }, []);

  const loadReportData = async () => {
    try {
      setLoading(true);
      
      // Simulate API calls - replace with actual API calls
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock data - replace with actual API responses
      setReportTemplates([
        {
          id: '1',
          name: 'Monthly Compliance Report',
          description: 'Comprehensive monthly compliance status across all operators and vehicles',
          type: 'monthly',
          category: 'performance',
          requiredBy: ['Internal Management', 'Board of Directors'],
          lastGenerated: '2024-01-01T00:00:00Z',
          nextDue: '2024-02-01T00:00:00Z',
          status: 'upcoming'
        },
        {
          id: '2',
          name: 'SADC Regulatory Report',
          description: 'Cross-border compliance report for SADC regulatory authorities',
          type: 'quarterly',
          category: 'sadc',
          requiredBy: ['SADC Secretariat', 'Regional Transport Authority'],
          lastGenerated: '2023-12-31T00:00:00Z',
          nextDue: '2024-03-31T00:00:00Z',
          status: 'current'
        },
        {
          id: '3',
          name: 'Audit Trail Report',
          description: 'Detailed audit trail of all compliance-related activities and decisions',
          type: 'monthly',
          category: 'audit',
          requiredBy: ['External Auditors', 'Compliance Officer'],
          lastGenerated: '2024-01-10T00:00:00Z',
          nextDue: '2024-02-10T00:00:00Z',
          status: 'current'
        },
        {
          id: '4',
          name: 'Risk Assessment Report',
          description: 'Risk analysis and compliance gap assessment across the platform',
          type: 'quarterly',
          category: 'risk',
          requiredBy: ['Risk Committee', 'Senior Management'],
          lastGenerated: '2023-10-01T00:00:00Z',
          nextDue: '2024-01-01T00:00:00Z',
          status: 'overdue'
        },
        {
          id: '5',
          name: 'Local Regulatory Compliance',
          description: 'Country-specific compliance reports for local authorities',
          type: 'monthly',
          category: 'local',
          requiredBy: ['Local Transport Authorities', 'Tax Authorities'],
          lastGenerated: '2024-01-05T00:00:00Z',
          nextDue: '2024-02-05T00:00:00Z',
          status: 'current'
        }
      ]);

      setGeneratedReports([
        {
          id: '1',
          templateId: '1',
          name: 'Monthly Compliance Report - December 2023',
          generatedAt: '2024-01-01T10:00:00Z',
          period: {
            start: '2023-12-01T00:00:00Z',
            end: '2023-12-31T23:59:59Z'
          },
          status: 'completed',
          fileUrl: '/reports/monthly-compliance-dec-2023.pdf',
          fileSize: 2456789,
          generatedBy: 'admin@autolodge.com'
        },
        {
          id: '2',
          templateId: '2',
          name: 'SADC Regulatory Report - Q4 2023',
          generatedAt: '2023-12-31T15:30:00Z',
          period: {
            start: '2023-10-01T00:00:00Z',
            end: '2023-12-31T23:59:59Z'
          },
          status: 'completed',
          fileUrl: '/reports/sadc-regulatory-q4-2023.pdf',
          fileSize: 3789456,
          generatedBy: 'compliance@autolodge.com'
        },
        {
          id: '3',
          templateId: '3',
          name: 'Audit Trail Report - January 2024',
          generatedAt: '2024-01-10T09:15:00Z',
          period: {
            start: '2024-01-01T00:00:00Z',
            end: '2024-01-31T23:59:59Z'
          },
          status: 'generating',
          generatedBy: 'audit@autolodge.com'
        }
      ]);

      setMetrics({
        totalOperators: 342,
        compliantOperators: 328,
        totalVehicles: 1256,
        compliantVehicles: 1147,
        activeDisputes: 7,
        resolvedDisputes: 89,
        complianceScore: 94,
        riskLevel: 'low'
      });
    } catch (error) {
      console.error('Failed to load report data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateReport = async (templateId: string) => {
    try {
      setGeneratingReports(prev => new Set(prev).add(templateId));
      
      // Simulate report generation - replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const template = reportTemplates.find(t => t.id === templateId);
      if (template) {
        const newReport: GeneratedReport = {
          id: Date.now().toString(),
          templateId,
          name: `${template.name} - ${new Date().toLocaleDateString()}`,
          generatedAt: new Date().toISOString(),
          period: {
            start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
            end: new Date().toISOString()
          },
          status: 'completed',
          fileUrl: `/reports/${template.name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.pdf`,
          fileSize: Math.floor(Math.random() * 5000000) + 1000000,
          generatedBy: 'current-user@autolodge.com'
        };
        
        setGeneratedReports(prev => [newReport, ...prev]);
      }
    } catch (error) {
      console.error('Failed to generate report:', error);
    } finally {
      setGeneratingReports(prev => {
        const newSet = new Set(prev);
        newSet.delete(templateId);
        return newSet;
      });
    }
  };

  const downloadReport = (report: GeneratedReport) => {
    // Simulate file download
    console.log('Downloading report:', report.name);
    // In a real app, this would trigger a file download
  };

  const getStatusColor = (status: ReportTemplate['status']) => {
    switch (status) {
      case 'current':
        return 'bg-green-100 text-green-800';
      case 'upcoming':
        return 'bg-blue-100 text-blue-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: ReportTemplate['status']) => {
    switch (status) {
      case 'current':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'upcoming':
        return <Clock className="h-4 w-4 text-blue-500" />;
      case 'overdue':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getCategoryColor = (category: ReportTemplate['category']) => {
    switch (category) {
      case 'sadc':
        return 'bg-blue-100 text-blue-800';
      case 'local':
        return 'bg-purple-100 text-purple-800';
      case 'audit':
        return 'bg-indigo-100 text-indigo-800';
      case 'risk':
        return 'bg-red-100 text-red-800';
      case 'performance':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatFileSize = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Compliance Reports</h1>
        <p className="text-gray-600 mt-2">
          Generate and manage compliance reports for regulatory authorities
        </p>
      </div>

      {/* Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Operator Compliance</p>
              <p className="text-2xl font-bold text-gray-900">
                {metrics.compliantOperators}/{metrics.totalOperators}
              </p>
            </div>
            <div className="p-3 bg-green-50 rounded-full">
              <Users className="h-6 w-6 text-green-600" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-sm text-green-600">
              {Math.round((metrics.compliantOperators / metrics.totalOperators) * 100)}% compliant
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Vehicle Compliance</p>
              <p className="text-2xl font-bold text-gray-900">
                {metrics.compliantVehicles}/{metrics.totalVehicles}
              </p>
            </div>
            <div className="p-3 bg-blue-50 rounded-full">
              <Car className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-sm text-blue-600">
              {Math.round((metrics.compliantVehicles / metrics.totalVehicles) * 100)}% compliant
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Disputes</p>
              <p className="text-2xl font-bold text-gray-900">{metrics.activeDisputes}</p>
            </div>
            <div className="p-3 bg-red-50 rounded-full">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-sm text-gray-600">
              {metrics.resolvedDisputes} resolved this month
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Overall Score</p>
              <p className="text-2xl font-bold text-green-600">{metrics.complianceScore}%</p>
            </div>
            <div className="p-3 bg-green-50 rounded-full">
              <Shield className="h-6 w-6 text-green-600" />
            </div>
          </div>
          <div className="mt-2">
            <div className={`text-sm ${
              metrics.riskLevel === 'low' ? 'text-green-600' :
              metrics.riskLevel === 'medium' ? 'text-yellow-600' :
              'text-red-600'
            }`}>
              {metrics.riskLevel} risk level
            </div>
          </div>
        </Card>
      </div>

      {/* Report Templates */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Report Templates</h2>
          <div className="flex items-center space-x-3">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="all">All Categories</option>
              <option value="sadc">SADC</option>
              <option value="local">Local</option>
              <option value="audit">Audit</option>
              <option value="risk">Risk</option>
              <option value="performance">Performance</option>
            </select>
          </div>
        </div>

        <div className="grid gap-4">
          {reportTemplates
            .filter(template => selectedCategory === 'all' || template.category === selectedCategory)
            .map((template) => (
            <div key={template.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="font-medium text-gray-900">{template.name}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(template.status)}`}>
                      {getStatusIcon(template.status)}
                      <span className="ml-1">{template.status}</span>
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(template.category)}`}>
                      {template.category}
                    </span>
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      {template.type}
                    </span>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-3">{template.description}</p>
                  
                  <div className="flex items-center space-x-6 text-xs text-gray-500">
                    <div>Required by: {template.requiredBy.join(', ')}</div>
                    {template.lastGenerated && (
                      <div>Last generated: {formatDate(template.lastGenerated)}</div>
                    )}
                    {template.nextDue && (
                      <div>Next due: {formatDate(template.nextDue)}</div>
                    )}
                  </div>
                </div>
                
                <Button
                  onClick={() => generateReport(template.id)}
                  disabled={generatingReports.has(template.id)}
                  className="flex items-center space-x-2"
                >
                  {generatingReports.has(template.id) ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Generating...</span>
                    </>
                  ) : (
                    <>
                      <BarChart3 className="h-4 w-4" />
                      <span>Generate</span>
                    </>
                  )}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Generated Reports */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Generated Reports</h2>
        
        <div className="space-y-4">
          {generatedReports.map((report) => (
            <div key={report.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="font-medium text-gray-900">{report.name}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      report.status === 'completed' ? 'bg-green-100 text-green-800' :
                      report.status === 'generating' ? 'bg-blue-100 text-blue-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {report.status}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-6 text-sm text-gray-600 mb-2">
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {formatDate(report.period.start)} - {formatDate(report.period.end)}
                      </span>
                    </div>
                    <div>Generated: {formatDateTime(report.generatedAt)}</div>
                    <div>By: {report.generatedBy}</div>
                    {report.fileSize && (
                      <div>Size: {formatFileSize(report.fileSize)}</div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  {report.status === 'completed' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => downloadReport(report)}
                      className="flex items-center space-x-1"
                    >
                      <Download className="h-3 w-3" />
                      <span>Download</span>
                    </Button>
                  )}
                  {report.status === 'generating' && (
                    <div className="flex items-center space-x-2 text-blue-600">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      <span className="text-sm">Generating...</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}