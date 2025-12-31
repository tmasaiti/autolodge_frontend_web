/**
 * Emergency Assistance Request Component
 * Provides quick access to emergency services and assistance requests
 */

import React, { useState, useEffect } from 'react';
import { Card, Button, Modal } from '../ui';
import { 
  Phone, MapPin, Clock, AlertTriangle, Car, Heart, 
  Wrench, Shield, Navigation, User, MessageCircle 
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { insuranceService } from '../../services/insuranceService';

export interface EmergencyAssistanceRequestProps {
  policyId: number;
  onRequestSubmitted?: (requestId: number) => void;
  className?: string;
}

interface AssistanceType {
  id: string;
  label: string;
  description: string;
  icon: React.ComponentType<any>;
  urgency: 'low' | 'medium' | 'high' | 'emergency';
  estimatedTime: string;
}

interface EmergencyContact {
  country: string;
  number: string;
  available_24_7: boolean;
}

interface AssistanceRequest {
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

const ASSISTANCE_TYPES: AssistanceType[] = [
  {
    id: 'roadside',
    label: 'Roadside Assistance',
    description: 'Flat tire, dead battery, lockout, fuel delivery',
    icon: Wrench,
    urgency: 'medium',
    estimatedTime: '30-60 minutes'
  },
  {
    id: 'medical',
    label: 'Medical Emergency',
    description: 'Medical assistance or ambulance service',
    icon: Heart,
    urgency: 'emergency',
    estimatedTime: '5-15 minutes'
  },
  {
    id: 'towing',
    label: 'Towing Service',
    description: 'Vehicle breakdown or accident towing',
    icon: Car,
    urgency: 'high',
    estimatedTime: '45-90 minutes'
  },
  {
    id: 'replacement_vehicle',
    label: 'Replacement Vehicle',
    description: 'Emergency replacement car arrangement',
    icon: Navigation,
    urgency: 'medium',
    estimatedTime: '2-4 hours'
  },
  {
    id: 'other',
    label: 'Other Emergency',
    description: 'Other urgent assistance needed',
    icon: AlertTriangle,
    urgency: 'high',
    estimatedTime: 'Varies'
  }
];

const URGENCY_CONFIG = {
  low: { color: 'bg-blue-100 text-blue-800', label: 'Low Priority' },
  medium: { color: 'bg-yellow-100 text-yellow-800', label: 'Medium Priority' },
  high: { color: 'bg-orange-100 text-orange-800', label: 'High Priority' },
  emergency: { color: 'bg-red-100 text-red-800', label: 'Emergency' }
};

export const EmergencyAssistanceRequest: React.FC<EmergencyAssistanceRequestProps> = ({
  policyId,
  onRequestSubmitted,
  className
}) => {
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>([]);
  const [selectedAssistanceType, setSelectedAssistanceType] = useState<string>('');
  const [requestData, setRequestData] = useState<Partial<AssistanceRequest>>({
    location: { latitude: 0, longitude: 0, address: '' },
    description: '',
    urgency: 'medium',
    contact_number: ''
  });
  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchEmergencyInfo();
  }, [policyId]);

  const fetchEmergencyInfo = async () => {
    try {
      const info = await insuranceService.getEmergencyAssistance(policyId);
      setEmergencyContacts(info.hotline_numbers);
    } catch (err) {
      console.error('Error fetching emergency info:', err);
    }
  };

  const getCurrentLocation = () => {
    setLocationLoading(true);
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setRequestData(prev => ({
            ...prev,
            location: {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              address: 'Current location detected'
            }
          }));
          setLocationLoading(false);
        },
        (error) => {
          console.error('Error getting location:', error);
          setError('Unable to get current location. Please enter address manually.');
          setLocationLoading(false);
        }
      );
    } else {
      setError('Geolocation is not supported by this browser.');
      setLocationLoading(false);
    }
  };

  const handleQuickCall = (phoneNumber: string) => {
    window.location.href = `tel:${phoneNumber}`;
  };

  const handleAssistanceTypeSelect = (typeId: string) => {
    const assistanceType = ASSISTANCE_TYPES.find(t => t.id === typeId);
    if (assistanceType) {
      setSelectedAssistanceType(typeId);
      setRequestData(prev => ({
        ...prev,
        assistance_type: typeId as any,
        urgency: assistanceType.urgency
      }));
      setShowRequestForm(true);
    }
  };

  const submitRequest = async () => {
    if (!selectedAssistanceType || !requestData.location?.address || !requestData.description || !requestData.contact_number) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await insuranceService.requestEmergencyAssistance(policyId, {
        assistance_type: requestData.assistance_type!,
        location: requestData.location!,
        description: requestData.description!,
        urgency: requestData.urgency!,
        contact_number: requestData.contact_number!
      });

      onRequestSubmitted?.(response.request_id);
      setShowRequestForm(false);
      
      // Show success message with provider info
      alert(`Emergency assistance requested successfully!\n\nRequest ID: ${response.request_id}\nProvider Contact: ${response.provider_contact}\n${response.estimated_arrival_time ? `Estimated Arrival: ${response.estimated_arrival_time}` : ''}`);
    } catch (err) {
      console.error('Error submitting assistance request:', err);
      setError('Failed to submit assistance request. Please try calling directly.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Emergency Hotlines */}
      <Card className="p-6 border-red-200 bg-red-50">
        <div className="flex items-center space-x-2 mb-4">
          <Phone className="h-6 w-6 text-red-600" />
          <h3 className="text-lg font-semibold text-red-900">Emergency Hotlines</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {emergencyContacts.map((contact, index) => (
            <Button
              key={index}
              variant="outline"
              onClick={() => handleQuickCall(contact.number)}
              className="h-auto p-4 border-red-300 hover:bg-red-100 text-left"
            >
              <div className="flex items-center space-x-3">
                <Phone className="h-5 w-5 text-red-600" />
                <div>
                  <div className="font-medium text-red-900">{contact.country}</div>
                  <div className="text-sm text-red-700">{contact.number}</div>
                  {contact.available_24_7 && (
                    <div className="text-xs text-red-600">24/7 Available</div>
                  )}
                </div>
              </div>
            </Button>
          ))}
        </div>
        
        <p className="text-sm text-red-700 mt-4">
          <AlertTriangle className="h-4 w-4 inline mr-1" />
          For life-threatening emergencies, call local emergency services (911, 112, etc.) first
        </p>
      </Card>

      {/* Assistance Types */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Request Assistance</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {ASSISTANCE_TYPES.map(type => {
            const IconComponent = type.icon;
            const urgencyConfig = URGENCY_CONFIG[type.urgency];
            
            return (
              <Button
                key={type.id}
                variant="outline"
                onClick={() => handleAssistanceTypeSelect(type.id)}
                className="h-auto p-4 text-left hover:shadow-md transition-shadow"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <IconComponent className="h-6 w-6 text-blue-600" />
                    <span className={cn('text-xs px-2 py-1 rounded-full', urgencyConfig.color)}>
                      {urgencyConfig.label}
                    </span>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-900">{type.label}</h4>
                    <p className="text-sm text-gray-600 mt-1">{type.description}</p>
                  </div>
                  
                  <div className="flex items-center text-xs text-gray-500">
                    <Clock className="h-3 w-3 mr-1" />
                    {type.estimatedTime}
                  </div>
                </div>
              </Button>
            );
          })}
        </div>
      </Card>

      {/* Request Form Modal */}
      <Modal isOpen={showRequestForm} onClose={() => setShowRequestForm(false)} size="lg">
        <Modal.Header>
          <div className="flex items-center space-x-2">
            <Shield className="h-6 w-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Request Emergency Assistance</h2>
              <p className="text-sm text-gray-500">
                {ASSISTANCE_TYPES.find(t => t.id === selectedAssistanceType)?.label}
              </p>
            </div>
          </div>
        </Modal.Header>

        <Modal.Body>
          <div className="space-y-6">
            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Current Location *
              </label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={requestData.location?.address || ''}
                  onChange={(e) => setRequestData(prev => ({
                    ...prev,
                    location: { ...prev.location!, address: e.target.value }
                  }))}
                  placeholder="Enter your current address or landmark"
                  className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={getCurrentLocation}
                  disabled={locationLoading}
                  className="flex-shrink-0"
                >
                  <MapPin className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Contact Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contact Number *
              </label>
              <input
                type="tel"
                value={requestData.contact_number || ''}
                onChange={(e) => setRequestData(prev => ({ ...prev, contact_number: e.target.value }))}
                placeholder="Phone number where you can be reached"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description of Situation *
              </label>
              <textarea
                value={requestData.description || ''}
                onChange={(e) => setRequestData(prev => ({ ...prev, description: e.target.value }))}
                rows={4}
                placeholder="Please describe your situation and what assistance you need..."
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* Urgency */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Urgency Level
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {Object.entries(URGENCY_CONFIG).map(([level, config]) => (
                  <label
                    key={level}
                    className={cn(
                      'relative rounded-lg border p-3 cursor-pointer text-center transition-colors',
                      requestData.urgency === level
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    )}
                  >
                    <input
                      type="radio"
                      name="urgency"
                      value={level}
                      checked={requestData.urgency === level}
                      onChange={(e) => setRequestData(prev => ({ ...prev, urgency: e.target.value as any }))}
                      className="sr-only"
                    />
                    <div className={cn('text-xs px-2 py-1 rounded-full', config.color)}>
                      {config.label}
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Important Information */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start space-x-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div className="text-sm text-yellow-800">
                  <p className="font-medium mb-1">Important Information</p>
                  <ul className="space-y-1 text-xs">
                    <li>• Keep your phone accessible for provider contact</li>
                    <li>• Stay in a safe location if possible</li>
                    <li>• Have your policy number ready: Policy #{policyId}</li>
                    <li>• For immediate danger, call local emergency services first</li>
                  </ul>
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center space-x-2 text-red-800">
                  <AlertTriangle className="h-5 w-5" />
                  <span className="font-medium">Error</span>
                </div>
                <p className="text-red-700 mt-1">{error}</p>
              </div>
            )}
          </div>
        </Modal.Body>

        <Modal.Footer>
          <div className="flex justify-between items-center w-full">
            <div className="text-sm text-gray-500">
              Estimated response time: {ASSISTANCE_TYPES.find(t => t.id === selectedAssistanceType)?.estimatedTime}
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" onClick={() => setShowRequestForm(false)} disabled={loading}>
                Cancel
              </Button>
              <Button onClick={submitRequest} loading={loading}>
                Request Assistance
              </Button>
            </div>
          </div>
        </Modal.Footer>
      </Modal>
    </div>
  );
};