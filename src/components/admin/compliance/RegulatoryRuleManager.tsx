/**
 * Regulatory Rule Manager Component
 * Interface for managing regulatory rules and compliance requirements
 */

import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  Filter, 
  FileText, 
  Calendar,
  Globe,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import { Modal } from '../../ui/Modal';

interface RegulatoryRule {
  id: string;
  name: string;
  description: string;
  category: 'sadc' | 'local' | 'insurance' | 'tax' | 'safety' | 'environmental';
  country: string;
  status: 'active' | 'pending' | 'deprecated' | 'draft';
  effectiveDate: string;
  expiryDate?: string;
  lastUpdated: string;
  complianceRate: number;
  requirements: string[];
  penalties: {
    type: 'warning' | 'fine' | 'suspension' | 'revocation';
    description: string;
    amount?: number;
  }[];
  relatedDocuments: string[];
  createdBy: string;
  updatedBy: string;
}

interface RuleFormData {
  name: string;
  description: string;
  category: RegulatoryRule['category'];
  country: string;
  effectiveDate: string;
  expiryDate?: string;
  requirements: string[];
  penalties: RegulatoryRule['penalties'];
  relatedDocuments: string[];
}

export function RegulatoryRuleManager() {
  const [rules, setRules] = useState<RegulatoryRule[]>([]);
  const [filteredRules, setFilteredRules] = useState<RegulatoryRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedCountry, setSelectedCountry] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [showRuleModal, setShowRuleModal] = useState(false);
  const [editingRule, setEditingRule] = useState<RegulatoryRule | null>(null);
  const [formData, setFormData] = useState<RuleFormData>({
    name: '',
    description: '',
    category: 'local',
    country: '',
    effectiveDate: '',
    expiryDate: '',
    requirements: [''],
    penalties: [{ type: 'warning', description: '' }],
    relatedDocuments: ['']
  });

  const categories = [
    { value: 'sadc', label: 'SADC Regional' },
    { value: 'local', label: 'Local/National' },
    { value: 'insurance', label: 'Insurance' },
    { value: 'tax', label: 'Tax & Finance' },
    { value: 'safety', label: 'Safety' },
    { value: 'environmental', label: 'Environmental' }
  ];

  const countries = [
    'South Africa', 'Botswana', 'Namibia', 'Zimbabwe', 'Zambia', 
    'Mozambique', 'Tanzania', 'Angola', 'Malawi', 'Lesotho', 
    'Eswatini', 'Madagascar', 'Mauritius', 'Seychelles', 'Comoros', 'DRC'
  ];

  useEffect(() => {
    loadRules();
  }, []);

  useEffect(() => {
    filterRules();
  }, [rules, searchTerm, selectedCategory, selectedCountry, selectedStatus]);

  const loadRules = async () => {
    try {
      setLoading(true);
      
      // Simulate API call - replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock data - replace with actual API response
      const mockRules: RegulatoryRule[] = [
        {
          id: '1',
          name: 'SADC Cross-Border Vehicle Permit',
          description: 'All vehicles crossing SADC borders must obtain valid cross-border permits before travel',
          category: 'sadc',
          country: 'Regional',
          status: 'active',
          effectiveDate: '2023-01-01T00:00:00Z',
          lastUpdated: '2024-01-01T00:00:00Z',
          complianceRate: 88,
          requirements: [
            'Valid vehicle registration',
            'Comprehensive insurance coverage',
            'Driver\'s license valid in destination country',
            'Permit application 48 hours before travel'
          ],
          penalties: [
            { type: 'fine', description: 'Crossing without permit', amount: 500 },
            { type: 'suspension', description: 'Repeated violations' }
          ],
          relatedDocuments: ['SADC Protocol on Transport', 'Cross-Border Guidelines'],
          createdBy: 'admin@autolodge.com',
          updatedBy: 'admin@autolodge.com'
        },
        {
          id: '2',
          name: 'Operator Business License Requirement',
          description: 'All vehicle rental operators must maintain valid business licenses',
          category: 'local',
          country: 'South Africa',
          status: 'active',
          effectiveDate: '2022-06-01T00:00:00Z',
          lastUpdated: '2023-12-15T00:00:00Z',
          complianceRate: 96,
          requirements: [
            'Valid business registration',
            'Tax clearance certificate',
            'Public liability insurance',
            'Annual license renewal'
          ],
          penalties: [
            { type: 'warning', description: 'First violation notice' },
            { type: 'fine', description: 'Operating without license', amount: 2000 },
            { type: 'revocation', description: 'Continued non-compliance' }
          ],
          relatedDocuments: ['Business Licensing Act', 'Operator Guidelines'],
          createdBy: 'admin@autolodge.com',
          updatedBy: 'compliance@autolodge.com'
        },
        {
          id: '3',
          name: 'Minimum Insurance Coverage',
          description: 'Minimum insurance coverage requirements for rental vehicles',
          category: 'insurance',
          country: 'Botswana',
          status: 'active',
          effectiveDate: '2023-03-01T00:00:00Z',
          expiryDate: '2025-03-01T00:00:00Z',
          lastUpdated: '2024-01-10T00:00:00Z',
          complianceRate: 91,
          requirements: [
            'Third-party liability: P500,000 minimum',
            'Comprehensive coverage for vehicle value',
            'Personal accident cover for passengers',
            'Cross-border coverage if applicable'
          ],
          penalties: [
            { type: 'fine', description: 'Insufficient coverage', amount: 1000 },
            { type: 'suspension', description: 'No insurance coverage' }
          ],
          relatedDocuments: ['Insurance Act', 'Motor Vehicle Insurance Regulations'],
          createdBy: 'admin@autolodge.com',
          updatedBy: 'legal@autolodge.com'
        }
      ];
      
      setRules(mockRules);
    } catch (error) {
      console.error('Failed to load rules:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterRules = () => {
    let filtered = rules;

    if (searchTerm) {
      filtered = filtered.filter(rule =>
        rule.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rule.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(rule => rule.category === selectedCategory);
    }

    if (selectedCountry !== 'all') {
      filtered = filtered.filter(rule => rule.country === selectedCountry);
    }

    if (selectedStatus !== 'all') {
      filtered = filtered.filter(rule => rule.status === selectedStatus);
    }

    setFilteredRules(filtered);
  };

  const handleCreateRule = () => {
    setEditingRule(null);
    setFormData({
      name: '',
      description: '',
      category: 'local',
      country: '',
      effectiveDate: '',
      expiryDate: '',
      requirements: [''],
      penalties: [{ type: 'warning', description: '' }],
      relatedDocuments: ['']
    });
    setShowRuleModal(true);
  };

  const handleEditRule = (rule: RegulatoryRule) => {
    setEditingRule(rule);
    setFormData({
      name: rule.name,
      description: rule.description,
      category: rule.category,
      country: rule.country,
      effectiveDate: rule.effectiveDate.split('T')[0],
      expiryDate: rule.expiryDate?.split('T')[0] || '',
      requirements: rule.requirements,
      penalties: rule.penalties,
      relatedDocuments: rule.relatedDocuments
    });
    setShowRuleModal(true);
  };

  const handleSaveRule = async () => {
    try {
      // Simulate API call - replace with actual API call
      console.log('Saving rule:', formData);
      
      if (editingRule) {
        // Update existing rule
        setRules(rules.map(rule => 
          rule.id === editingRule.id 
            ? { ...rule, ...formData, lastUpdated: new Date().toISOString() }
            : rule
        ));
      } else {
        // Create new rule
        const newRule: RegulatoryRule = {
          id: Date.now().toString(),
          ...formData,
          status: 'draft',
          lastUpdated: new Date().toISOString(),
          complianceRate: 0,
          createdBy: 'current-user@autolodge.com',
          updatedBy: 'current-user@autolodge.com'
        };
        setRules([...rules, newRule]);
      }
      
      setShowRuleModal(false);
    } catch (error) {
      console.error('Failed to save rule:', error);
    }
  };

  const handleDeleteRule = async (ruleId: string) => {
    if (window.confirm('Are you sure you want to delete this rule?')) {
      try {
        // Simulate API call - replace with actual API call
        setRules(rules.filter(rule => rule.id !== ruleId));
      } catch (error) {
        console.error('Failed to delete rule:', error);
      }
    }
  };

  const getStatusColor = (status: RegulatoryRule['status']) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'deprecated':
        return 'bg-red-100 text-red-800';
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryColor = (category: RegulatoryRule['category']) => {
    switch (category) {
      case 'sadc':
        return 'bg-blue-100 text-blue-800';
      case 'local':
        return 'bg-purple-100 text-purple-800';
      case 'insurance':
        return 'bg-indigo-100 text-indigo-800';
      case 'tax':
        return 'bg-orange-100 text-orange-800';
      case 'safety':
        return 'bg-red-100 text-red-800';
      case 'environmental':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-12 bg-gray-200 rounded"></div>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Regulatory Rule Management</h1>
          <p className="text-gray-600 mt-2">
            Manage compliance rules and regulatory requirements
          </p>
        </div>
        <Button onClick={handleCreateRule} className="flex items-center space-x-2">
          <Plus className="h-4 w-4" />
          <span>Add New Rule</span>
        </Button>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search rules..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            <option value="all">All Categories</option>
            {categories.map(category => (
              <option key={category.value} value={category.value}>
                {category.label}
              </option>
            ))}
          </select>
          
          <select
            value={selectedCountry}
            onChange={(e) => setSelectedCountry(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            <option value="all">All Countries</option>
            <option value="Regional">Regional</option>
            {countries.map(country => (
              <option key={country} value={country}>
                {country}
              </option>
            ))}
          </select>
          
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="pending">Pending</option>
            <option value="draft">Draft</option>
            <option value="deprecated">Deprecated</option>
          </select>
        </div>
      </Card>

      {/* Rules List */}
      <div className="space-y-4">
        {filteredRules.map((rule) => (
          <Card key={rule.id} className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <h3 className="text-lg font-medium text-gray-900">{rule.name}</h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(rule.status)}`}>
                    {rule.status}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(rule.category)}`}>
                    {rule.category}
                  </span>
                </div>
                
                <p className="text-gray-600 mb-4">{rule.description}</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Requirements:</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      {rule.requirements.slice(0, 3).map((req, index) => (
                        <li key={index} className="flex items-start space-x-2">
                          <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span>{req}</span>
                        </li>
                      ))}
                      {rule.requirements.length > 3 && (
                        <li className="text-gray-500">
                          +{rule.requirements.length - 3} more requirements
                        </li>
                      )}
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Penalties:</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      {rule.penalties.slice(0, 2).map((penalty, index) => (
                        <li key={index} className="flex items-start space-x-2">
                          <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                          <span>
                            {penalty.description}
                            {penalty.amount && ` ($${penalty.amount})`}
                          </span>
                        </li>
                      ))}
                      {rule.penalties.length > 2 && (
                        <li className="text-gray-500">
                          +{rule.penalties.length - 2} more penalties
                        </li>
                      )}
                    </ul>
                  </div>
                </div>
                
                <div className="flex items-center space-x-6 text-sm text-gray-500">
                  <div className="flex items-center space-x-1">
                    <Globe className="h-4 w-4" />
                    <span>{rule.country}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-4 w-4" />
                    <span>Effective: {formatDate(rule.effectiveDate)}</span>
                  </div>
                  {rule.expiryDate && (
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-4 w-4" />
                      <span>Expires: {formatDate(rule.expiryDate)}</span>
                    </div>
                  )}
                  <div className="flex items-center space-x-1">
                    <FileText className="h-4 w-4" />
                    <span>{rule.relatedDocuments.length} documents</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2 ml-4">
                <div className="text-right">
                  <div className="text-lg font-bold text-green-600">
                    {rule.complianceRate}%
                  </div>
                  <div className="text-xs text-gray-500">Compliance</div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleEditRule(rule)}
                  className="flex items-center space-x-1"
                >
                  <Edit className="h-3 w-3" />
                  <span>Edit</span>
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDeleteRule(rule.id)}
                  className="flex items-center space-x-1 text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-3 w-3" />
                  <span>Delete</span>
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Rule Form Modal */}
      <Modal isOpen={showRuleModal} onClose={() => setShowRuleModal(false)} size="lg">
        <Modal.Header>
          <h2 className="text-xl font-semibold">
            {editingRule ? 'Edit Rule' : 'Create New Rule'}
          </h2>
        </Modal.Header>
        <Modal.Body>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Rule Name
              </label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter rule name"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enter rule description"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value as RegulatoryRule['category'] })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  {categories.map(category => (
                    <option key={category.value} value={category.value}>
                      {category.label}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Country
                </label>
                <select
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="">Select country</option>
                  <option value="Regional">Regional (SADC)</option>
                  {countries.map(country => (
                    <option key={country} value={country}>
                      {country}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Effective Date
                </label>
                <Input
                  type="date"
                  value={formData.effectiveDate}
                  onChange={(e) => setFormData({ ...formData, effectiveDate: e.target.value })}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Expiry Date (Optional)
                </label>
                <Input
                  type="date"
                  value={formData.expiryDate}
                  onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                />
              </div>
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <div className="flex items-center space-x-3">
            <Button variant="outline" onClick={() => setShowRuleModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveRule}>
              {editingRule ? 'Update Rule' : 'Create Rule'}
            </Button>
          </div>
        </Modal.Footer>
      </Modal>
    </div>
  );
}