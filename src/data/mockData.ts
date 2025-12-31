/**
 * Mock data for development and testing
 */

export interface MockUser {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: 'renter' | 'operator' | 'admin';
  avatar?: string;
  isVerified: boolean;
  trustScore: number;
  profile: {
    first_name: string;
    last_name: string;
    nationality: string;
    date_of_birth: string;
    preferences?: {
      currency: string;
      language: string;
      notifications?: {
        email: boolean;
        sms: boolean;
        push: boolean;
      };
    };
  };
  verification_status: {
    email_verified: boolean;
    phone_verified: boolean;
    identity_verified: boolean;
    license_verified: boolean;
    verification_level: string;
  };
  phone?: string;
  updated_at: string;
}

export interface MockVehicle {
  id: number;
  operatorId: number;
  make: string;
  model: string;
  year: number;
  category: string;
  dailyRate: number;
  currency: string;
  location: {
    city: string;
    country: string;
    coordinates: [number, number];
  };
  images: string[];
  rating: number;
  reviewCount: number;
  features: string[];
  available: boolean;
  crossBorderAllowed: boolean;
}

export interface MockBooking {
  id: number;
  vehicleId: number;
  renterId: number;
  status: 'pending' | 'confirmed' | 'active' | 'completed' | 'cancelled';
  startDate: string;
  endDate: string;
  totalAmount: number;
  currency: string;
  pickupLocation: string;
  dropoffLocation: string;
}

// Mock Users
export const mockUsers: MockUser[] = [
  {
    id: 1,
    email: 'john.doe@example.com',
    firstName: 'John',
    lastName: 'Doe',
    role: 'renter',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
    isVerified: true,
    trustScore: 4.8,
    profile: {
      first_name: 'John',
      last_name: 'Doe',
      nationality: 'South African',
      date_of_birth: '1990-05-15',
      preferences: {
        currency: 'USD',
        language: 'en',
        notifications: {
          email: true,
          sms: true,
          push: true
        }
      }
    },
    verification_status: {
      email_verified: true,
      phone_verified: true,
      identity_verified: true,
      license_verified: true,
      verification_level: 'verified'
    },
    phone: '+27123456789',
    updated_at: '2024-01-15T10:30:00Z'
  },
  {
    id: 2,
    email: 'sarah.operator@example.com',
    firstName: 'Sarah',
    lastName: 'Johnson',
    role: 'operator',
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
    isVerified: true,
    trustScore: 4.9,
    profile: {
      first_name: 'Sarah',
      last_name: 'Johnson',
      nationality: 'South African',
      date_of_birth: '1985-08-22',
      preferences: {
        currency: 'USD',
        language: 'en',
        notifications: {
          email: true,
          sms: true,
          push: true
        }
      }
    },
    verification_status: {
      email_verified: true,
      phone_verified: true,
      identity_verified: true,
      license_verified: true,
      verification_level: 'operator'
    },
    phone: '+27987654321',
    updated_at: '2024-01-15T10:30:00Z'
  },
  {
    id: 3,
    email: 'admin@autolodge.com',
    firstName: 'Admin',
    lastName: 'User',
    role: 'admin',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
    isVerified: true,
    trustScore: 5.0,
    profile: {
      first_name: 'Admin',
      last_name: 'User',
      nationality: 'South African',
      date_of_birth: '1980-01-01',
      preferences: {
        currency: 'USD',
        language: 'en',
        notifications: {
          email: true,
          sms: true,
          push: true
        }
      }
    },
    verification_status: {
      email_verified: true,
      phone_verified: true,
      identity_verified: true,
      license_verified: true,
      verification_level: 'admin'
    },
    phone: '+27111222333',
    updated_at: '2024-01-15T10:30:00Z'
  }
];

// Mock Vehicles
export const mockVehicles: MockVehicle[] = [
  {
    id: 1,
    operatorId: 2,
    make: 'Toyota',
    model: 'Hilux',
    year: 2022,
    category: 'SUV',
    dailyRate: 85,
    currency: 'USD',
    location: {
      city: 'Cape Town',
      country: 'South Africa',
      coordinates: [-33.9249, 18.4241]
    },
    images: [
      'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=800&h=600&fit=crop'
    ],
    rating: 4.7,
    reviewCount: 23,
    features: ['4WD', 'Air Conditioning', 'GPS Navigation', 'Bluetooth', 'USB Charging'],
    available: true,
    crossBorderAllowed: true
  },
  {
    id: 2,
    operatorId: 2,
    make: 'Ford',
    model: 'Ranger',
    year: 2021,
    category: 'Pickup',
    dailyRate: 75,
    currency: 'USD',
    location: {
      city: 'Johannesburg',
      country: 'South Africa',
      coordinates: [-26.2041, 28.0473]
    },
    images: [
      'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&h=600&fit=crop'
    ],
    rating: 4.5,
    reviewCount: 18,
    features: ['4WD', 'Air Conditioning', 'Tow Bar', 'Load Cover'],
    available: true,
    crossBorderAllowed: true
  },
  {
    id: 3,
    operatorId: 2,
    make: 'Volkswagen',
    model: 'Polo',
    year: 2023,
    category: 'Compact',
    dailyRate: 45,
    currency: 'USD',
    location: {
      city: 'Windhoek',
      country: 'Namibia',
      coordinates: [-22.5609, 17.0658]
    },
    images: [
      'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800&h=600&fit=crop'
    ],
    rating: 4.3,
    reviewCount: 12,
    features: ['Air Conditioning', 'Bluetooth', 'USB Charging', 'Electric Windows'],
    available: true,
    crossBorderAllowed: false
  },
  {
    id: 4,
    operatorId: 2,
    make: 'Land Rover',
    model: 'Defender',
    year: 2022,
    category: 'SUV',
    dailyRate: 120,
    currency: 'USD',
    location: {
      city: 'Gaborone',
      country: 'Botswana',
      coordinates: [-24.6282, 25.9231]
    },
    images: [
      'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop'
    ],
    rating: 4.9,
    reviewCount: 31,
    features: ['4WD', 'Air Conditioning', 'GPS Navigation', 'Roof Rack', 'Winch', 'Satellite Phone'],
    available: true,
    crossBorderAllowed: true
  },
  {
    id: 5,
    operatorId: 2,
    make: 'Nissan',
    model: 'NP300',
    year: 2021,
    category: 'Pickup',
    dailyRate: 65,
    currency: 'USD',
    location: {
      city: 'Lusaka',
      country: 'Zambia',
      coordinates: [-15.3875, 28.3228]
    },
    images: [
      'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800&h=600&fit=crop'
    ],
    rating: 4.4,
    reviewCount: 15,
    features: ['4WD', 'Air Conditioning', 'Load Cover', 'Tow Bar'],
    available: false,
    crossBorderAllowed: true
  }
];

// Mock Bookings
export const mockBookings: MockBooking[] = [
  {
    id: 1,
    vehicleId: 1,
    renterId: 1,
    status: 'confirmed',
    startDate: '2024-02-15',
    endDate: '2024-02-20',
    totalAmount: 425,
    currency: 'USD',
    pickupLocation: 'Cape Town International Airport',
    dropoffLocation: 'Cape Town International Airport'
  },
  {
    id: 2,
    vehicleId: 4,
    renterId: 1,
    status: 'active',
    startDate: '2024-01-10',
    endDate: '2024-01-17',
    totalAmount: 840,
    currency: 'USD',
    pickupLocation: 'Gaborone City Center',
    dropoffLocation: 'Maun Airport'
  },
  {
    id: 3,
    vehicleId: 2,
    renterId: 1,
    status: 'completed',
    startDate: '2023-12-05',
    endDate: '2023-12-12',
    totalAmount: 525,
    currency: 'USD',
    pickupLocation: 'OR Tambo International Airport',
    dropoffLocation: 'OR Tambo International Airport'
  }
];

// Mock Search Results
export const mockSearchResults = {
  vehicles: mockVehicles.filter(v => v.available),
  total: mockVehicles.filter(v => v.available).length,
  filters: {
    categories: ['SUV', 'Pickup', 'Compact', 'Sedan'],
    priceRange: { min: 45, max: 120 },
    features: ['4WD', 'Air Conditioning', 'GPS Navigation', 'Bluetooth', 'USB Charging'],
    countries: ['South Africa', 'Namibia', 'Botswana', 'Zambia']
  }
};

// Mock Notifications
export const mockNotifications = [
  {
    id: 1,
    type: 'booking_confirmed',
    title: 'Booking Confirmed',
    message: 'Your booking for Toyota Hilux has been confirmed',
    timestamp: '2024-01-15T10:30:00Z',
    read: false
  },
  {
    id: 2,
    type: 'payment_received',
    title: 'Payment Received',
    message: 'Payment of $425 has been processed successfully',
    timestamp: '2024-01-15T09:15:00Z',
    read: true
  },
  {
    id: 3,
    type: 'document_required',
    title: 'Document Required',
    message: 'Please upload your driving license for verification',
    timestamp: '2024-01-14T16:45:00Z',
    read: false
  }
];

// Helper functions
export const getCurrentUser = (): MockUser => {
  // In a real app, this would come from authentication context
  return mockUsers[0]; // Default to first user (renter)
};

export const getVehicleById = (id: number): MockVehicle | undefined => {
  return mockVehicles.find(v => v.id === id);
};

export const getUserBookings = (userId: number): MockBooking[] => {
  return mockBookings.filter(b => b.renterId === userId);
};

export const getOperatorVehicles = (operatorId: number): MockVehicle[] => {
  return mockVehicles.filter(v => v.operatorId === operatorId);
};

// Mock API delay simulation
export const delay = (ms: number = 500): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};