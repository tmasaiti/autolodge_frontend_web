import { api } from './api'
import { SearchParams, SearchResult } from '../store/slices/searchSlice'
import { Vehicle } from '../types/vehicle'

export const vehicleService = {
  // Search vehicles
  searchVehicles: async (params: SearchParams): Promise<{ results: SearchResult[], total: number, hasMore: boolean }> => {
    const response = await api.post<{ results: SearchResult[], total: number, hasMore: boolean }>('/vehicles/search', params)
    return response.data
  },

  // Get vehicle by ID
  getVehicle: async (id: number): Promise<Vehicle> => {
    // Mock implementation for now - in real app this would call the API
    const mockVehicle: Vehicle = {
      id: id,
      operator_id: 1,
      registration: 'CA 456 789',
      category: 'Sedan',
      make: 'BMW',
      model: '3 Series',
      year: 2023,
      color: 'Black',
      vin: 'WBA123456789',
      specifications: {
        engine: {
          type: 'Inline-4 Turbo',
          displacement: 2.0,
          fuel_type: 'Petrol'
        },
        transmission: 'Automatic',
        seats: 5,
        doors: 4,
        features: ['GPS Navigation', 'Air Conditioning', 'Bluetooth', 'Backup Camera', 'Heated Seats'],
        safety_features: ['ABS', 'Airbags', 'Stability Control', 'Lane Departure Warning'],
        entertainment: ['Premium Audio', 'Apple CarPlay', 'Android Auto', 'USB Charging']
      },
      pricing: {
        base_daily_rate: 650,
        currency: 'ZAR',
        seasonal_adjustments: {
          peak_multiplier: 1.3,
          off_peak_multiplier: 0.8
        },
        distance_pricing: {
          included_km_per_day: 250,
          excess_km_rate: 3.5
        },
        cross_border_surcharge: 75,
        security_deposit: 3000
      },
      availability: {
        calendar_type: 'calendar_based',
        advance_booking_days: 60,
        minimum_rental_days: 1,
        maximum_rental_days: 30,
        blocked_dates: ['2024-02-14', '2024-02-15'],
        available_times: {
          start_time: '08:00',
          end_time: '18:00'
        }
      },
      cross_border_config: {
        allowed: true,
        countries: ['ZA', 'BW', 'NA', 'SZ'],
        surcharge_percentage: 15,
        required_documents: ['passport', 'international_license', 'insurance'],
        insurance_requirements: ['comprehensive', 'third_party']
      },
      verification: {
        status: 'verified',
        verified_at: '2024-01-20',
        documents_verified: ['registration', 'insurance', 'roadworthy']
      },
      status: 'available',
      location: {
        latitude: -33.9249,
        longitude: 18.4241,
        address: '123 Main Street, City Bowl',
        city: 'Cape Town',
        state: 'Western Cape',
        country: 'South Africa',
        postal_code: '8001'
      },
      description: 'Luxury sedan perfect for business trips and special occasions. Features premium interior, advanced safety systems, and excellent fuel efficiency. Ideal for both city driving and longer journeys.',
      photos: [
        {
          id: 1,
          url: '/vehicle-bmw-1.jpg',
          caption: 'Front exterior view',
          is_primary: true,
          order_index: 0
        },
        {
          id: 2,
          url: '/vehicle-bmw-2.jpg',
          caption: 'Interior dashboard',
          is_primary: false,
          order_index: 1
        },
        {
          id: 3,
          url: '/vehicle-bmw-3.jpg',
          caption: 'Side profile',
          is_primary: false,
          order_index: 2
        },
        {
          id: 4,
          url: '/vehicle-bmw-4.jpg',
          caption: '360° exterior view',
          is_primary: false,
          order_index: 3
        }
      ],
      created_at: '2024-01-20T10:00:00Z',
      updated_at: '2024-01-25T15:30:00Z'
    };

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    return mockVehicle;
  },

  // Get vehicles by operator
  getOperatorVehicles: async (operatorId: number): Promise<Vehicle[]> => {
    const response = await api.get<Vehicle[]>(`/operators/${operatorId}/vehicles`)
    return response.data
  },

  // Create vehicle
  createVehicle: async (vehicleData: Omit<Vehicle, 'id' | 'created_at' | 'updated_at'>): Promise<Vehicle> => {
    const response = await api.post<Vehicle>('/vehicles', vehicleData)
    return response.data
  },

  // Update vehicle
  updateVehicle: async (id: number, vehicleData: Partial<Vehicle>): Promise<Vehicle> => {
    const response = await api.put<Vehicle>(`/vehicles/${id}`, vehicleData)
    return response.data
  },

  // Delete vehicle
  deleteVehicle: async (id: number): Promise<void> => {
    await api.delete(`/vehicles/${id}`)
  },

  // Check availability
  checkAvailability: async (vehicleId: number, startDate: string, endDate: string): Promise<boolean> => {
    const response = await api.post<{ available: boolean }>('/vehicles/availability', {
      vehicle_id: vehicleId,
      start_date: startDate,
      end_date: endDate,
    })
    return response.data.available
  },
}