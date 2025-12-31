import React, { useState, useEffect } from 'react';
import { Car, Plus, Edit, Trash2, MapPin, DollarSign } from 'lucide-react';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import { Modal } from '../../ui/Modal';
import { WizardStepProps } from '../../wizard/WizardStepWrapper';

export interface FleetVehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  category: string;
  registration: string;
  color?: string;
  dailyRate: number;
  currency: string;
  location: {
    address: string;
    city: string;
    country: string;
  };
  features: string[];
  photos: File[];
  status: 'draft' | 'pending_verification' | 'active';
}

export interface FleetSetupStepData {
  vehicles: FleetVehicle[];
  fleetName: string;
  operatingAreas: string[];
  defaultCurrency: string;
  minimumFleetSize: number;
  acknowledgedTerms: boolean;
}

const VEHICLE_CATEGORIES = [
  'Economy',
  'Compact',
  'Mid-size',
  'Full-size',
  'Premium',
  'Luxury',
  'SUV',
  'Pickup Truck',
  'Van',
  'Convertible'
];

const COMMON_FEATURES = [
  'Air Conditioning',
  'GPS Navigation',
  'Bluetooth',
  'USB Charging',
  'Backup Camera',
  'Parking Sensors',
  'Cruise Control',
  'Heated Seats',
  'Sunroof',
  'All-Wheel Drive'
];

export const FleetSetupStep: React.FC<WizardStepProps> = ({
  data,
  onDataChange,
  onNext
}) => {
  const [formData, setFormData] = useState<FleetSetupStepData>({
    vehicles: data.vehicles || [],
    fleetName: data.fleetName || '',
    operatingAreas: data.operatingAreas || [],
    defaultCurrency: data.defaultCurrency || 'USD',
    minimumFleetSize: 1,
    acknowledgedTerms: data.acknowledgedTerms || false
  });

  const [isAddingVehicle, setIsAddingVehicle] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<FleetVehicle | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Update parent data when form changes
  useEffect(() => {
    onDataChange(formData);
  }, [formData, onDataChange]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.fleetName.trim()) {
      newErrors.fleetName = 'Fleet name is required';
    }

    if (formData.vehicles.length < formData.minimumFleetSize) {
      newErrors.vehicles = `You need at least ${formData.minimumFleetSize} vehicle(s) to start`;
    }

    if (formData.operatingAreas.length === 0) {
      newErrors.operatingAreas = 'Please specify at least one operating area';
    }

    if (!formData.acknowledgedTerms) {
      newErrors.terms = 'Please acknowledge the fleet operator terms';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddVehicle = (vehicle: Omit<FleetVehicle, 'id'>) => {
    const newVehicle: FleetVehicle = {
      ...vehicle,
      id: Date.now().toString()
    };

    setFormData(prev => ({
      ...prev,
      vehicles: [...prev.vehicles, newVehicle]
    }));

    setIsAddingVehicle(false);
  };

  const handleEditVehicle = (vehicle: FleetVehicle) => {
    setFormData(prev => ({
      ...prev,
      vehicles: prev.vehicles.map(v => v.id === vehicle.id ? vehicle : v)
    }));

    setEditingVehicle(null);
  };

  const handleDeleteVehicle = (vehicleId: string) => {
    setFormData(prev => ({
      ...prev,
      vehicles: prev.vehicles.filter(v => v.id !== vehicleId)
    }));
  };

  const handleInputChange = (field: keyof FleetSetupStepData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleOperatingAreaAdd = (area: string) => {
    if (area.trim() && !formData.operatingAreas.includes(area.trim())) {
      setFormData(prev => ({
        ...prev,
        operatingAreas: [...prev.operatingAreas, area.trim()]
      }));
    }
  };

  const handleOperatingAreaRemove = (area: string) => {
    setFormData(prev => ({
      ...prev,
      operatingAreas: prev.operatingAreas.filter(a => a !== area)
    }));
  };

  const handleSubmit = () => {
    if (validateForm()) {
      onNext?.();
    }
  };

  return (
    <div className="space-y-6">
      {/* Fleet Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900 flex items-center">
          <Car className="h-5 w-5 mr-2" />
          Fleet Information
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Fleet Name"
            value={formData.fleetName}
            onChange={(e) => handleInputChange('fleetName', e.target.value)}
            placeholder="e.g., Cape Town Car Rentals"
            error={errors.fleetName}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Default Currency
            </label>
            <select
              value={formData.defaultCurrency}
              onChange={(e) => handleInputChange('defaultCurrency', e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="USD">USD - US Dollar</option>
              <option value="ZAR">ZAR - South African Rand</option>
              <option value="BWP">BWP - Botswana Pula</option>
              <option value="NAD">NAD - Namibian Dollar</option>
              <option value="ZMW">ZMW - Zambian Kwacha</option>
            </select>
          </div>
        </div>

        {/* Operating Areas */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Operating Areas
          </label>
          <OperatingAreasInput
            areas={formData.operatingAreas}
            onAdd={handleOperatingAreaAdd}
            onRemove={handleOperatingAreaRemove}
            error={errors.operatingAreas}
          />
        </div>
      </div>

      {/* Vehicle Fleet */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">
            Your Vehicle Fleet ({formData.vehicles.length})
          </h3>
          <Button
            variant="primary"
            onClick={() => setIsAddingVehicle(true)}
            className="flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Vehicle
          </Button>
        </div>

        {errors.vehicles && (
          <p className="text-sm text-red-600">{errors.vehicles}</p>
        )}

        {formData.vehicles.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <Car className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">No vehicles added yet</h4>
            <p className="text-gray-600 mb-4">
              Add your first vehicle to start building your fleet
            </p>
            <Button
              variant="primary"
              onClick={() => setIsAddingVehicle(true)}
            >
              Add Your First Vehicle
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {formData.vehicles.map(vehicle => (
              <VehicleCard
                key={vehicle.id}
                vehicle={vehicle}
                onEdit={() => setEditingVehicle(vehicle)}
                onDelete={() => handleDeleteVehicle(vehicle.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Fleet Operator Terms */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h4 className="font-medium text-gray-900 mb-4">Fleet Operator Agreement</h4>
        
        <div className="space-y-3 text-sm text-gray-700 mb-4">
          <p>By proceeding, you agree to:</p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li>Maintain all vehicles in safe, roadworthy condition</li>
            <li>Provide accurate vehicle information and photos</li>
            <li>Respond to booking requests within 2 hours</li>
            <li>Honor confirmed bookings and maintain availability</li>
            <li>Follow AutoLodge's quality and safety standards</li>
            <li>Pay platform fees as outlined in the operator agreement</li>
          </ul>
        </div>

        <div className="flex items-start space-x-2">
          <input
            type="checkbox"
            id="acknowledgeTerms"
            checked={formData.acknowledgedTerms}
            onChange={(e) => handleInputChange('acknowledgedTerms', e.target.checked)}
            className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <label htmlFor="acknowledgeTerms" className="text-sm text-gray-700">
            I acknowledge and agree to the fleet operator terms and conditions
          </label>
        </div>
        
        {errors.terms && (
          <p className="text-sm text-red-600 mt-2">{errors.terms}</p>
        )}
      </div>

      {/* Continue Button */}
      <div className="flex justify-end">
        <Button 
          variant="primary" 
          onClick={handleSubmit}
          disabled={formData.vehicles.length === 0 || !formData.acknowledgedTerms}
        >
          Complete Fleet Setup
        </Button>
      </div>

      {/* Add/Edit Vehicle Modal */}
      {(isAddingVehicle || editingVehicle) && (
        <VehicleModal
          vehicle={editingVehicle}
          defaultCurrency={formData.defaultCurrency}
          onSave={editingVehicle ? 
            (vehicle: FleetVehicle | Omit<FleetVehicle, 'id'>) => {
              if ('id' in vehicle) {
                handleEditVehicle(vehicle);
              }
            } : 
            (vehicle: FleetVehicle | Omit<FleetVehicle, 'id'>) => {
              if (!('id' in vehicle)) {
                handleAddVehicle(vehicle);
              }
            }
          }
          onClose={() => {
            setIsAddingVehicle(false);
            setEditingVehicle(null);
          }}
        />
      )}
    </div>
  );
};

// Operating Areas Input Component
interface OperatingAreasInputProps {
  areas: string[];
  onAdd: (area: string) => void;
  onRemove: (area: string) => void;
  error?: string;
}

const OperatingAreasInput: React.FC<OperatingAreasInputProps> = ({
  areas,
  onAdd,
  onRemove,
  error
}) => {
  const [inputValue, setInputValue] = useState('');

  const handleAdd = () => {
    if (inputValue.trim()) {
      onAdd(inputValue);
      setInputValue('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd();
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex space-x-2">
        <Input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="e.g., Cape Town, Johannesburg"
          className="flex-1"
        />
        <Button variant="outline" onClick={handleAdd}>
          Add
        </Button>
      </div>
      
      {areas.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {areas.map(area => (
            <span
              key={area}
              className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
            >
              {area}
              <button
                onClick={() => onRemove(area)}
                className="ml-2 text-blue-600 hover:text-blue-800"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
      
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};

// Vehicle Card Component
interface VehicleCardProps {
  vehicle: FleetVehicle;
  onEdit: () => void;
  onDelete: () => void;
}

const VehicleCard: React.FC<VehicleCardProps> = ({ vehicle, onEdit, onDelete }) => {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h4 className="font-medium text-gray-900">
            {vehicle.year} {vehicle.make} {vehicle.model}
          </h4>
          <p className="text-sm text-gray-600">{vehicle.category}</p>
        </div>
        
        <div className="flex space-x-1">
          <Button variant="ghost" size="sm" onClick={onEdit}>
            <Edit className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={onDelete} className="text-red-600">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex items-center text-gray-600">
          <Car className="h-4 w-4 mr-2" />
          {vehicle.registration}
        </div>
        
        <div className="flex items-center text-gray-600">
          <DollarSign className="h-4 w-4 mr-2" />
          {vehicle.dailyRate} {vehicle.currency}/day
        </div>
        
        <div className="flex items-center text-gray-600">
          <MapPin className="h-4 w-4 mr-2" />
          {vehicle.location.city}
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-gray-200">
        <span className={`
          inline-flex items-center px-2 py-1 rounded-full text-xs font-medium
          ${vehicle.status === 'active' ? 'bg-green-100 text-green-800' :
            vehicle.status === 'pending_verification' ? 'bg-yellow-100 text-yellow-800' :
            'bg-gray-100 text-gray-800'}
        `}>
          {vehicle.status === 'active' ? 'Active' :
           vehicle.status === 'pending_verification' ? 'Pending Verification' :
           'Draft'}
        </span>
      </div>
    </div>
  );
};

// Vehicle Modal Component
interface VehicleModalProps {
  vehicle?: FleetVehicle | null;
  defaultCurrency: string;
  onSave: (vehicle: FleetVehicle | Omit<FleetVehicle, 'id'>) => void;
  onClose: () => void;
}

const VehicleModal: React.FC<VehicleModalProps> = ({
  vehicle,
  defaultCurrency,
  onSave,
  onClose
}) => {
  const [formData, setFormData] = useState({
    make: vehicle?.make || '',
    model: vehicle?.model || '',
    year: vehicle?.year || new Date().getFullYear(),
    category: vehicle?.category || '',
    registration: vehicle?.registration || '',
    color: vehicle?.color || '',
    dailyRate: vehicle?.dailyRate || 0,
    currency: vehicle?.currency || defaultCurrency,
    location: vehicle?.location || {
      address: '',
      city: '',
      country: ''
    },
    features: vehicle?.features || [],
    photos: vehicle?.photos || [],
    status: vehicle?.status || 'draft' as const
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.make.trim()) newErrors.make = 'Make is required';
    if (!formData.model.trim()) newErrors.model = 'Model is required';
    if (!formData.category) newErrors.category = 'Category is required';
    if (!formData.registration.trim()) newErrors.registration = 'Registration is required';
    if (formData.dailyRate <= 0) newErrors.dailyRate = 'Daily rate must be greater than 0';
    if (!formData.location.city.trim()) newErrors.city = 'City is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      if (vehicle) {
        onSave({ ...vehicle, ...formData });
      } else {
        onSave(formData);
      }
    }
  };

  return (
    <Modal isOpen={true} onClose={onClose} size="lg">
      <Modal.Header>
        <h3 className="text-lg font-medium">
          {vehicle ? 'Edit Vehicle' : 'Add Vehicle'}
        </h3>
      </Modal.Header>
      
      <Modal.Body>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Make"
              value={formData.make}
              onChange={(e) => setFormData(prev => ({ ...prev, make: e.target.value }))}
              placeholder="Toyota"
              error={errors.make}
            />
            
            <Input
              label="Model"
              value={formData.model}
              onChange={(e) => setFormData(prev => ({ ...prev, model: e.target.value }))}
              placeholder="Camry"
              error={errors.model}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              type="number"
              label="Year"
              value={formData.year.toString()}
              onChange={(e) => setFormData(prev => ({ ...prev, year: parseInt(e.target.value) || 0 }))}
              min="1990"
              max={new Date().getFullYear() + 1}
            />
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="">Select category</option>
                {VEHICLE_CATEGORIES.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
              {errors.category && (
                <p className="text-sm text-red-600 mt-1">{errors.category}</p>
              )}
            </div>
            
            <Input
              label="Color"
              value={formData.color}
              onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
              placeholder="White"
            />
          </div>

          <Input
            label="Registration Number"
            value={formData.registration}
            onChange={(e) => setFormData(prev => ({ ...prev, registration: e.target.value }))}
            placeholder="ABC 123 GP"
            error={errors.registration}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              type="number"
              label="Daily Rate"
              value={formData.dailyRate.toString()}
              onChange={(e) => setFormData(prev => ({ ...prev, dailyRate: parseFloat(e.target.value) || 0 }))}
              min="0"
              step="0.01"
              error={errors.dailyRate}
            />
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Currency
              </label>
              <select
                value={formData.currency}
                onChange={(e) => setFormData(prev => ({ ...prev, currency: e.target.value }))}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="USD">USD</option>
                <option value="ZAR">ZAR</option>
                <option value="BWP">BWP</option>
                <option value="NAD">NAD</option>
                <option value="ZMW">ZMW</option>
              </select>
            </div>
          </div>

          <Input
            label="City"
            value={formData.location.city}
            onChange={(e) => setFormData(prev => ({ 
              ...prev, 
              location: { ...prev.location, city: e.target.value }
            }))}
            placeholder="Cape Town"
            error={errors.city}
          />
        </div>
      </Modal.Body>
      
      <Modal.Footer>
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="primary" onClick={handleSubmit}>
          {vehicle ? 'Update Vehicle' : 'Add Vehicle'}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};