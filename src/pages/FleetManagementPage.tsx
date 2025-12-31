import React, { useState, useEffect } from 'react';
import { Vehicle } from '../types/vehicle';
import { vehicleService } from '../services/vehicleService';
import { VehicleEditor } from '../components/fleet/VehicleEditor';
import { VehicleListingCard } from '../components/fleet/VehicleListingCard';
import { FleetAnalytics } from '../components/fleet/FleetAnalytics';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { 
  Plus, 
  Car, 
  BarChart3, 
  Settings, 
  Filter,
  Search,
  Grid,
  List
} from 'lucide-react';

interface FleetStats {
  total_vehicles: number;
  active_vehicles: number;
  total_bookings: number;
  monthly_revenue: number;
  occupancy_rate: number;
}

export const FleetManagementPage: React.FC = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditor, setShowEditor] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [fleetStats, setFleetStats] = useState<FleetStats | null>(null);

  // Mock operator ID - in real app this would come from auth context
  const operatorId = 1;

  useEffect(() => {
    loadFleetData();
  }, []);

  const loadFleetData = async () => {
    setLoading(true);
    try {
      // Mock fleet data - in real app this would call the API
      const mockVehicles: Vehicle[] = [
        {
          id: 1,
          operator_id: operatorId,
          registration: 'CA 123 456',
          category: 'Sedan',
          make: 'BMW',
          model: '3 Series',
          year: 2023,
          color: 'Black',
          vin: 'WBA123456789',
          specifications: {
            engine: { type: 'Inline-4 Turbo', displacement: 2.0, fuel_type: 'Petrol' },
            transmission: 'Automatic',
            seats: 5,
            doors: 4,
            features: ['GPS Navigation', 'Air Conditioning', 'Bluetooth'],
            safety_features: ['ABS', 'Airbags'],
            entertainment: ['Premium Audio', 'USB Charging']
          },
          pricing: {
            base_daily_rate: 650,
            currency: 'ZAR',
            seasonal_adjustments: { peak_multiplier: 1.3, off_peak_multiplier: 0.8 },
            distance_pricing: { included_km_per_day: 250, excess_km_rate: 3.5 },
            cross_border_surcharge: 75,
            security_deposit: 3000
          },
          availability: {
            calendar_type: 'calendar_based',
            advance_booking_days: 60,
            minimum_rental_days: 1,
            maximum_rental_days: 30,
            blocked_dates: [],
            available_times: { start_time: '08:00', end_time: '18:00' }
          },
          cross_border_config: {
            allowed: true,
            countries: ['ZA', 'BW', 'NA'],
            surcharge_percentage: 15,
            required_documents: ['passport'],
            insurance_requirements: ['comprehensive']
          },
          verification: {
            status: 'verified',
            verified_at: '2024-01-20',
            documents_verified: ['registration']
          },
          status: 'available',
          location: {
            latitude: -33.9249,
            longitude: 18.4241,
            address: '123 Main Street',
            city: 'Cape Town',
            country: 'South Africa'
          },
          description: 'Luxury sedan perfect for business trips',
          photos: [
            { id: 1, url: '/vehicle-1.jpg', caption: 'Front view', is_primary: true, order_index: 0 }
          ],
          created_at: '2024-01-20T10:00:00Z',
          updated_at: '2024-01-25T15:30:00Z'
        },
        {
          id: 2,
          operator_id: operatorId,
          registration: 'CA 789 012',
          category: 'SUV',
          make: 'Toyota',
          model: 'Fortuner',
          year: 2022,
          color: 'White',
          vin: 'JTN123456789',
          specifications: {
            engine: { type: 'V6', displacement: 2.8, fuel_type: 'Diesel' },
            transmission: 'Automatic',
            seats: 7,
            doors: 5,
            features: ['GPS Navigation', 'Air Conditioning', 'Bluetooth', '4WD'],
            safety_features: ['ABS', 'Airbags', 'Stability Control'],
            entertainment: ['Touchscreen', 'USB', 'Bluetooth Audio']
          },
          pricing: {
            base_daily_rate: 850,
            currency: 'ZAR',
            seasonal_adjustments: { peak_multiplier: 1.4, off_peak_multiplier: 0.85 },
            distance_pricing: { included_km_per_day: 300, excess_km_rate: 4.0 },
            cross_border_surcharge: 100,
            security_deposit: 5000
          },
          availability: {
            calendar_type: 'calendar_based',
            advance_booking_days: 90,
            minimum_rental_days: 2,
            maximum_rental_days: 45,
            blocked_dates: ['2024-02-20', '2024-02-21'],
            available_times: { start_time: '07:00', end_time: '19:00' }
          },
          cross_border_config: {
            allowed: true,
            countries: ['ZA', 'BW', 'NA', 'SZ'],
            surcharge_percentage: 20,
            required_documents: ['passport', 'international_license'],
            insurance_requirements: ['comprehensive', 'third_party']
          },
          verification: {
            status: 'verified',
            verified_at: '2024-01-15',
            documents_verified: ['registration', 'insurance']
          },
          status: 'available',
          location: {
            latitude: -33.9249,
            longitude: 18.4241,
            address: '456 Second Street',
            city: 'Cape Town',
            country: 'South Africa'
          },
          description: 'Spacious SUV perfect for family adventures',
          photos: [
            { id: 2, url: '/vehicle-2.jpg', caption: 'Front view', is_primary: true, order_index: 0 }
          ],
          created_at: '2024-01-15T10:00:00Z',
          updated_at: '2024-01-20T15:30:00Z'
        }
      ];

      const mockStats: FleetStats = {
        total_vehicles: 2,
        active_vehicles: 2,
        total_bookings: 15,
        monthly_revenue: 12500,
        occupancy_rate: 68
      };

      setVehicles(mockVehicles);
      setFleetStats(mockStats);
    } catch (error) {
      console.error('Failed to load fleet data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddVehicle = () => {
    setEditingVehicle(null);
    setShowEditor(true);
  };

  const handleEditVehicle = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle);
    setShowEditor(true);
  };

  const handleDeleteVehicle = async (vehicleId: number) => {
    if (window.confirm('Are you sure you want to delete this vehicle?')) {
      try {
        await vehicleService.deleteVehicle(vehicleId);
        setVehicles(vehicles.filter(v => v.id !== vehicleId));
      } catch (error) {
        console.error('Failed to delete vehicle:', error);
      }
    }
  };

  const handleVehicleSaved = (savedVehicle: Vehicle) => {
    if (editingVehicle) {
      // Update existing vehicle
      setVehicles(vehicles.map(v => v.id === savedVehicle.id ? savedVehicle : v));
    } else {
      // Add new vehicle
      setVehicles([...vehicles, savedVehicle]);
    }
    setShowEditor(false);
    setEditingVehicle(null);
  };

  const filteredVehicles = vehicles.filter(vehicle => {
    const matchesStatus = filterStatus === 'all' || vehicle.status === filterStatus;
    const matchesSearch = searchQuery === '' || 
      vehicle.make.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vehicle.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vehicle.registration.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesStatus && matchesSearch;
  });

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-64 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Fleet Management</h1>
          <p className="text-gray-600 mt-1">Manage your vehicle listings and availability</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => setShowAnalytics(true)}
            className="flex items-center gap-2"
          >
            <BarChart3 className="w-4 h-4" />
            Analytics
          </Button>
          <Button
            onClick={handleAddVehicle}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Vehicle
          </Button>
        </div>
      </div>

      {/* Fleet Stats */}
      {fleetStats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <Card padding="md">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{fleetStats.total_vehicles}</div>
              <div className="text-sm text-gray-600">Total Vehicles</div>
            </div>
          </Card>
          
          <Card padding="md">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{fleetStats.active_vehicles}</div>
              <div className="text-sm text-gray-600">Active</div>
            </div>
          </Card>
          
          <Card padding="md">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{fleetStats.total_bookings}</div>
              <div className="text-sm text-gray-600">Total Bookings</div>
            </div>
          </Card>
          
          <Card padding="md">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">R{fleetStats.monthly_revenue.toLocaleString()}</div>
              <div className="text-sm text-gray-600">Monthly Revenue</div>
            </div>
          </Card>
          
          <Card padding="md">
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{fleetStats.occupancy_rate}%</div>
              <div className="text-sm text-gray-600">Occupancy Rate</div>
            </div>
          </Card>
        </div>
      )}

      {/* Filters and Controls */}
      <Card padding="md" className="mb-6">
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="flex items-center gap-4 flex-1">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search vehicles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Status Filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="available">Available</option>
              <option value="booked">Booked</option>
              <option value="maintenance">Maintenance</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === 'grid' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              <Grid className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>

      {/* Vehicle List */}
      {filteredVehicles.length === 0 ? (
        <Card padding="lg" className="text-center">
          <Car className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No vehicles found</h3>
          <p className="text-gray-600 mb-6">
            {vehicles.length === 0 
              ? "Get started by adding your first vehicle to the fleet."
              : "Try adjusting your search or filter criteria."
            }
          </p>
          {vehicles.length === 0 && (
            <Button onClick={handleAddVehicle} className="flex items-center gap-2 mx-auto">
              <Plus className="w-4 h-4" />
              Add Your First Vehicle
            </Button>
          )}
        </Card>
      ) : (
        <div className={viewMode === 'grid' 
          ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
          : 'space-y-4'
        }>
          {filteredVehicles.map(vehicle => (
            <VehicleListingCard
              key={vehicle.id}
              vehicle={vehicle}
              viewMode={viewMode}
              onEdit={() => handleEditVehicle(vehicle)}
              onDelete={() => handleDeleteVehicle(vehicle.id)}
            />
          ))}
        </div>
      )}

      {/* Vehicle Editor Modal */}
      <Modal
        isOpen={showEditor}
        onClose={() => {
          setShowEditor(false);
          setEditingVehicle(null);
        }}
        size="xl"
      >
        <VehicleEditor
          vehicle={editingVehicle}
          onSave={handleVehicleSaved}
          onCancel={() => {
            setShowEditor(false);
            setEditingVehicle(null);
          }}
        />
      </Modal>

      {/* Analytics Modal */}
      <Modal
        isOpen={showAnalytics}
        onClose={() => setShowAnalytics(false)}
        size="xl"
      >
        <FleetAnalytics
          operatorId={operatorId}
          onClose={() => setShowAnalytics(false)}
        />
      </Modal>
    </div>
  );
};