import { api } from './api';
import { BookingPricing, BookingLocations, CrossBorderDetails, BookingAddOns, RentalAgreement } from '../schemas/booking-schemas';

export interface AvailabilityCheck {
  vehicle_id: number;
  start_date: string;
  end_date: string;
  start_time?: string;
  end_time?: string;
}

export interface AvailabilityResult {
  available: boolean;
  conflicts?: {
    start_date: string;
    end_date: string;
    reason: string;
  }[];
  alternative_dates?: {
    start_date: string;
    end_date: string;
  }[];
}

export interface PricingCalculationRequest {
  vehicle_id: number;
  start_date: string;
  end_date: string;
  locations: BookingLocations;
  cross_border?: CrossBorderDetails;
  add_ons?: BookingAddOns;
  user_country?: string;
}

export interface PricingCalculationResult {
  pricing: BookingPricing;
  breakdown: {
    base_rental: number;
    days: number;
    daily_rate: number;
    seasonal_adjustment: number;
    cross_border_surcharge: number;
    insurance_premium: number;
    add_ons_total: number;
    taxes_total: number;
    platform_fee: number;
    security_deposit: number;
    total_before_tax: number;
    total_amount: number;
  };
  price_lock_expires_at: string;
}

export interface BookingCreationRequest {
  vehicle_id: number;
  renter_id: number;
  date_range: {
    start_date: string;
    end_date: string;
    start_time?: string;
    end_time?: string;
  };
  locations: BookingLocations;
  pricing: BookingPricing;
  cross_border?: CrossBorderDetails;
  add_ons?: BookingAddOns;
  payment_method_id: string;
  agreement: RentalAgreement;
}

export interface BookingCreationResult {
  booking_id: number;
  status: string;
  confirmation_number: string;
  payment_intent_id?: string;
  contract_url: string;
  estimated_pickup_time: string;
}

export interface ContractTemplate {
  id: number;
  version: string;
  template_html: string;
  terms: {
    section: string;
    content: string;
    required_acknowledgment: boolean;
  }[];
  liability_waivers: string[];
  fuel_policy_options: ('full_to_full' | 'same_to_same' | 'prepaid')[];
  mileage_policy: {
    included_km: number;
    excess_rate: number;
  };
}

export const bookingService = {
  // Real-time availability validation
  checkAvailability: async (request: AvailabilityCheck): Promise<AvailabilityResult> => {
    try {
      const response = await api.post<AvailabilityResult>('/bookings/availability', request);
      return response.data;
    } catch (error) {
      // Mock implementation for development
      console.warn('Using mock availability check:', error);
      
      // Simulate some unavailable dates
      const unavailableDates = ['2024-02-14', '2024-02-15', '2024-03-01'];
      const requestStart = new Date(request.start_date);
      const requestEnd = new Date(request.end_date);
      
      const hasConflict = unavailableDates.some(date => {
        const unavailableDate = new Date(date);
        return unavailableDate >= requestStart && unavailableDate <= requestEnd;
      });

      if (hasConflict) {
        return {
          available: false,
          conflicts: [{
            start_date: '2024-02-14',
            end_date: '2024-02-15',
            reason: 'Vehicle already booked'
          }],
          alternative_dates: [{
            start_date: '2024-02-16',
            end_date: '2024-02-18'
          }]
        };
      }

      return { available: true };
    }
  },

  // Calculate pricing with taxes and fees
  calculatePricing: async (request: PricingCalculationRequest): Promise<PricingCalculationResult> => {
    try {
      const response = await api.post<PricingCalculationResult>('/bookings/pricing', request);
      return response.data;
    } catch (error) {
      // Mock implementation for development
      console.warn('Using mock pricing calculation:', error);
      
      const startDate = new Date(request.start_date);
      const endDate = new Date(request.end_date);
      const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      
      // Mock daily rate - in real app this comes from vehicle data
      const baseDailyRate = 450;
      const baseRental = baseDailyRate * days;
      
      // Mock seasonal adjustment (peak season = 20% increase)
      const isPeakSeason = startDate.getMonth() >= 11 || startDate.getMonth() <= 1; // Dec-Feb
      const seasonalAdjustment = isPeakSeason ? baseRental * 0.2 : 0;
      
      // Cross-border surcharge
      const crossBorderSurcharge = request.cross_border?.destination_countries.length ? 
        request.cross_border.surcharge_applied : 0;
      
      // Insurance premium
      const insurancePremium = request.add_ons?.insurance_product_id ? 
        (request.add_ons.insurance_product_id * 25 * days) : 0; // Mock calculation
      
      // Add-ons total
      const addOnsTotal = (request.add_ons?.gps_navigation?.enabled ? request.add_ons.gps_navigation.fee * days : 0) +
                         (request.add_ons?.child_seat?.enabled ? request.add_ons.child_seat.fee_per_item * request.add_ons.child_seat.quantity * days : 0) +
                         (request.add_ons?.additional_driver?.enabled ? request.add_ons.additional_driver.fee : 0);
      
      const subtotal = baseRental + seasonalAdjustment + crossBorderSurcharge + insurancePremium + addOnsTotal;
      
      // Tax calculation (VAT 15% for South Africa)
      const vatRate = 0.15;
      const vatAmount = subtotal * vatRate;
      
      // Platform fee (3% of subtotal)
      const platformFee = subtotal * 0.03;
      
      // Security deposit
      const securityDeposit = 2000;
      
      const totalAmount = subtotal + vatAmount + platformFee + securityDeposit;
      
      // Price lock expires in 30 minutes
      const priceLockExpiry = new Date();
      priceLockExpiry.setMinutes(priceLockExpiry.getMinutes() + 30);

      const pricing: BookingPricing = {
        daily_rate: baseDailyRate,
        total_days: days,
        subtotal: subtotal,
        taxes: [{
          tax_type: 'VAT',
          rate_percent: vatRate * 100,
          amount: vatAmount,
          currency: 'ZAR',
          description: 'Value Added Tax'
        }],
        platform_fee: platformFee,
        security_deposit: securityDeposit,
        cross_border_surcharge: crossBorderSurcharge,
        insurance_premium: insurancePremium,
        additional_fees: {
          cleaning_fee: 0,
          delivery_fee: 0,
          fuel_fee: 0,
          late_return_fee: 0
        },
        discounts: {
          weekly_discount: days >= 7 ? subtotal * 0.1 : 0,
          monthly_discount: days >= 30 ? subtotal * 0.2 : 0,
          promotional_discount: 0,
          loyalty_discount: 0
        },
        total_amount: totalAmount,
        currency: 'ZAR',
        locked_at: new Date().toISOString()
      };

      return {
        pricing,
        breakdown: {
          base_rental: baseRental,
          days,
          daily_rate: baseDailyRate,
          seasonal_adjustment: seasonalAdjustment,
          cross_border_surcharge: crossBorderSurcharge,
          insurance_premium: insurancePremium,
          add_ons_total: addOnsTotal,
          taxes_total: vatAmount,
          platform_fee: platformFee,
          security_deposit: securityDeposit,
          total_before_tax: subtotal,
          total_amount: totalAmount
        },
        price_lock_expires_at: priceLockExpiry.toISOString()
      };
    }
  },

  // Get contract template
  getContractTemplate: async (vehicleId: number): Promise<ContractTemplate> => {
    try {
      const response = await api.get<ContractTemplate>(`/vehicles/${vehicleId}/contract-template`);
      return response.data;
    } catch (error) {
      // Mock implementation for development
      console.warn('Using mock contract template:', error);
      
      return {
        id: 1,
        version: '2024.1',
        template_html: `
          <div class="contract-template">
            <h1>Vehicle Rental Agreement</h1>
            <p>This agreement is between AutoLodge and the renter for the rental of vehicle {{vehicle_make}} {{vehicle_model}} ({{vehicle_registration}}).</p>
            
            <h2>Rental Period</h2>
            <p>From: {{start_date}} at {{start_time}}</p>
            <p>To: {{end_date}} at {{end_time}}</p>
            
            <h2>Pickup and Return Locations</h2>
            <p>Pickup: {{pickup_address}}</p>
            <p>Return: {{return_address}}</p>
            
            <h2>Rental Terms</h2>
            <ul>
              <li>Daily Rate: {{daily_rate}} {{currency}}</li>
              <li>Total Days: {{total_days}}</li>
              <li>Security Deposit: {{security_deposit}} {{currency}}</li>
              <li>Total Amount: {{total_amount}} {{currency}}</li>
            </ul>
            
            <h2>Vehicle Condition</h2>
            <p>The renter acknowledges receiving the vehicle in good condition and agrees to return it in the same condition, normal wear and tear excepted.</p>
            
            <h2>Insurance and Liability</h2>
            <p>The renter is responsible for any damage to the vehicle during the rental period. Insurance coverage details are outlined in the selected insurance policy.</p>
            
            <h2>Fuel Policy</h2>
            <p>Fuel Policy: {{fuel_policy}}</p>
            
            <h2>Mileage Policy</h2>
            <p>Included kilometers per day: {{included_km}}</p>
            <p>Excess rate: {{excess_rate}} {{currency}} per km</p>
          </div>
        `,
        terms: [
          {
            section: 'Vehicle Use',
            content: 'The vehicle must be used only for lawful purposes and by licensed drivers.',
            required_acknowledgment: true
          },
          {
            section: 'Damage Responsibility',
            content: 'Renter is responsible for all damage to the vehicle during the rental period.',
            required_acknowledgment: true
          },
          {
            section: 'Traffic Violations',
            content: 'Renter is responsible for all traffic fines and violations incurred during the rental.',
            required_acknowledgment: true
          }
        ],
        liability_waivers: [
          'I waive any claims against AutoLodge for personal injury during the rental period',
          'I acknowledge that I am fully responsible for the vehicle during the rental period',
          'I understand the terms and conditions of this rental agreement'
        ],
        fuel_policy_options: ['full_to_full', 'same_to_same', 'prepaid'],
        mileage_policy: {
          included_km: 200,
          excess_rate: 3.5
        }
      };
    }
  },

  // Create booking
  createBooking: async (request: BookingCreationRequest): Promise<BookingCreationResult> => {
    try {
      const response = await api.post<BookingCreationResult>('/bookings', request);
      return response.data;
    } catch (error) {
      // Mock implementation for development
      console.warn('Using mock booking creation:', error);
      
      // Simulate booking creation delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const bookingId = Math.floor(Math.random() * 10000) + 1000;
      
      return {
        booking_id: bookingId,
        status: 'confirmed',
        confirmation_number: `AL${bookingId}`,
        contract_url: `/contracts/${bookingId}.pdf`,
        estimated_pickup_time: request.date_range.start_date + 'T' + (request.date_range.start_time || '10:00')
      };
    }
  },

  // Get booking details
  getBooking: async (bookingId: number) => {
    try {
      const response = await api.get(`/bookings/${bookingId}`);
      return response.data;
    } catch (error) {
      console.warn('Using mock booking details:', error);
      
      // Mock booking data with full structure
      return {
        id: bookingId,
        renter_id: 1,
        vehicle_id: 1,
        operator_id: 1,
        status: 'confirmed',
        date_range: {
          start_date: '2024-02-20',
          end_date: '2024-02-25'
        },
        locations: {
          pickup: {
            latitude: -33.9249,
            longitude: 18.4241,
            address: '123 Main Street, City Bowl',
            city: 'Cape Town',
            country: 'South Africa',
            instructions: 'Please arrive 15 minutes early for vehicle inspection'
          },
          dropoff: {
            latitude: -33.9249,
            longitude: 18.4241,
            address: '123 Main Street, City Bowl',
            city: 'Cape Town',
            country: 'South Africa',
            instructions: 'Return with same fuel level as pickup'
          },
          same_location: true
        },
        pricing: {
          daily_rate: 450,
          total_days: 5,
          subtotal: 2250,
          taxes: [{
            tax_type: 'VAT',
            rate_percent: 15,
            amount: 337.50,
            currency: 'ZAR',
            description: 'Value Added Tax'
          }],
          platform_fee: 67.50,
          security_deposit: 2000,
          additional_fees: {
            cleaning_fee: 0,
            delivery_fee: 0,
            fuel_fee: 0,
            late_return_fee: 0
          },
          discounts: {
            weekly_discount: 0,
            monthly_discount: 0,
            promotional_discount: 0,
            loyalty_discount: 0
          },
          total_amount: 4655,
          currency: 'ZAR'
        },
        vehicle: {
          id: 1,
          make: 'BMW',
          model: '3 Series',
          year: 2023,
          category: 'Sedan',
          specifications: {
            engine: {
              type: 'Inline-4 Turbo',
              displacement: 2.0,
              fuel_type: 'Petrol'
            },
            transmission: 'Automatic',
            seats: 5,
            doors: 4,
            features: ['GPS Navigation', 'Air Conditioning', 'Bluetooth'],
            safety_features: ['ABS', 'Airbags', 'Stability Control'],
            entertainment: ['Premium Audio', 'Apple CarPlay', 'Android Auto']
          },
          photos: [{
            url: '/vehicle-bmw-1.jpg',
            is_primary: true
          }]
        },
        operator: {
          id: 1,
          name: 'Premium Car Rentals',
          rating: 4.8
        },
        timeline: [
          {
            id: '1',
            type: 'created',
            timestamp: '2024-02-15T10:00:00Z',
            description: 'Booking created',
            performed_by: {
              id: 1,
              name: 'John Doe',
              type: 'renter'
            },
            visible_to: ['renter', 'operator', 'admin']
          },
          {
            id: '2',
            type: 'confirmed',
            timestamp: '2024-02-15T10:05:00Z',
            description: 'Booking confirmed by operator',
            performed_by: {
              id: 2,
              name: 'Premium Car Rentals',
              type: 'operator'
            },
            visible_to: ['renter', 'operator', 'admin']
          },
          {
            id: '3',
            type: 'payment_captured',
            timestamp: '2024-02-15T10:10:00Z',
            description: 'Payment processed successfully',
            performed_by: {
              id: 0,
              name: 'AutoLodge System',
              type: 'system'
            },
            visible_to: ['renter', 'operator', 'admin']
          }
        ],
        created_at: '2024-02-15T10:00:00Z',
        updated_at: '2024-02-15T10:10:00Z'
      };
    }
  },

  // Get user's bookings
  getUserBookings: async (userId: number, status?: string[]) => {
    try {
      const params = status ? { status: status.join(',') } : {};
      const response = await api.get(`/users/${userId}/bookings`, { params });
      return response.data;
    } catch (error) {
      console.warn('Using mock user bookings:', error);
      
      // Mock bookings data
      return [
        {
          id: 1001,
          renter_id: userId,
          vehicle_id: 1,
          operator_id: 1,
          status: 'confirmed',
          date_range: {
            start_date: '2024-03-15',
            end_date: '2024-03-18'
          },
          locations: {
            pickup: {
              latitude: -33.9249,
              longitude: 18.4241,
              address: '123 Main Street',
              city: 'Cape Town',
              country: 'South Africa'
            },
            dropoff: {
              latitude: -33.9249,
              longitude: 18.4241,
              address: '123 Main Street',
              city: 'Cape Town',
              country: 'South Africa'
            },
            same_location: true
          },
          pricing: {
            daily_rate: 450,
            total_days: 3,
            subtotal: 1350,
            taxes: [{ tax_type: 'VAT', rate_percent: 15, amount: 202.50, currency: 'ZAR' }],
            platform_fee: 40.50,
            security_deposit: 2000,
            additional_fees: {},
            discounts: {},
            total_amount: 3593,
            currency: 'ZAR'
          },
          vehicle: {
            id: 1,
            make: 'BMW',
            model: '3 Series',
            year: 2023,
            category: 'Sedan',
            specifications: {
              engine: { type: 'Petrol', displacement: 2.0, fuel_type: 'Petrol' },
              transmission: 'Automatic',
              seats: 5,
              doors: 4,
              features: [],
              safety_features: [],
              entertainment: []
            },
            photos: [{ url: '/vehicle-bmw-1.jpg', is_primary: true }]
          },
          operator: {
            id: 1,
            name: 'Premium Car Rentals',
            rating: 4.8
          },
          timeline: [],
          created_at: '2024-02-20T10:00:00Z',
          updated_at: '2024-02-20T10:00:00Z'
        },
        {
          id: 1002,
          renter_id: userId,
          vehicle_id: 2,
          operator_id: 2,
          status: 'completed',
          date_range: {
            start_date: '2024-02-01',
            end_date: '2024-02-05'
          },
          locations: {
            pickup: {
              latitude: -26.2041,
              longitude: 28.0473,
              address: '456 Business District',
              city: 'Johannesburg',
              country: 'South Africa'
            },
            dropoff: {
              latitude: -26.2041,
              longitude: 28.0473,
              address: '456 Business District',
              city: 'Johannesburg',
              country: 'South Africa'
            },
            same_location: true
          },
          pricing: {
            daily_rate: 380,
            total_days: 4,
            subtotal: 1520,
            taxes: [{ tax_type: 'VAT', rate_percent: 15, amount: 228, currency: 'ZAR' }],
            platform_fee: 45.60,
            security_deposit: 1500,
            additional_fees: {},
            discounts: {},
            total_amount: 3293.60,
            currency: 'ZAR'
          },
          vehicle: {
            id: 2,
            make: 'Toyota',
            model: 'Corolla',
            year: 2022,
            category: 'Economy',
            specifications: {
              engine: { type: 'Petrol', displacement: 1.6, fuel_type: 'Petrol' },
              transmission: 'Manual',
              seats: 5,
              doors: 4,
              features: [],
              safety_features: [],
              entertainment: []
            },
            photos: [{ url: '/vehicle-toyota-1.jpg', is_primary: true }]
          },
          operator: {
            id: 2,
            name: 'City Car Hire',
            rating: 4.5
          },
          timeline: [],
          created_at: '2024-01-25T10:00:00Z',
          updated_at: '2024-02-05T18:00:00Z'
        }
      ];
    }
  },

  // Modify booking
  modifyBooking: async (bookingId: number, modifications: any) => {
    try {
      const response = await api.put(`/bookings/${bookingId}`, modifications);
      return response.data;
    } catch (error) {
      console.warn('Using mock booking modification:', error);
      
      // Simulate modification delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      return {
        success: true,
        booking_id: bookingId,
        message: 'Booking modified successfully',
        price_difference: modifications.priceDifference || 0
      };
    }
  },

  // Cancel booking
  cancelBooking: async (bookingId: number, reason?: string) => {
    try {
      const response = await api.post(`/bookings/${bookingId}/cancel`, { reason });
      return response.data;
    } catch (error) {
      console.warn('Using mock booking cancellation:', error);
      
      // Simulate cancellation delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return {
        success: true,
        booking_id: bookingId,
        status: 'cancelled',
        refund_amount: 0, // Would be calculated based on cancellation policy
        message: 'Booking cancelled successfully'
      };
    }
  }
};