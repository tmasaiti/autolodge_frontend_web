/**
 * Test data fixtures for E2E tests
 */

export const testUsers = {
  renter: {
    email: 'test.renter@autolodge.com',
    password: 'TestPassword123!',
    profile: {
      first_name: 'John',
      last_name: 'Doe',
      date_of_birth: '1990-01-01',
      nationality: 'ZA',
      phone: '+27123456789'
    }
  },
  operator: {
    email: 'test.operator@autolodge.com',
    password: 'TestPassword123!',
    profile: {
      first_name: 'Jane',
      last_name: 'Smith',
      business_name: 'Test Fleet Services',
      business_registration: 'REG123456'
    }
  },
  admin: {
    email: 'test.admin@autolodge.com',
    password: 'AdminPassword123!',
    profile: {
      first_name: 'Admin',
      last_name: 'User',
      role: 'admin'
    }
  }
};

export const testVehicles = {
  sedan: {
    make: 'Toyota',
    model: 'Camry',
    year: 2022,
    category: 'sedan',
    registration: 'TEST001GP',
    specifications: {
      engine: {
        type: 'I4',
        displacement: 2.5,
        fuel_type: 'petrol'
      },
      transmission: 'automatic',
      drivetrain: 'fwd',
      seats: 5,
      doors: 4,
      features: ['GPS', 'Bluetooth', 'AC'],
      safety_features: ['ABS', 'Airbags', 'ESC'],
      entertainment: ['Radio', 'USB', 'Bluetooth'],
      comfort_features: ['AC', 'Power Windows', 'Power Steering']
    },
    pricing: {
      base_daily_rate: 450,
      currency: 'ZAR',
      security_deposit: 2000,
      cross_border_surcharge: 150
    },
    cross_border_config: {
      allowed: true,
      countries: ['BW', 'NA', 'SZ', 'LS'],
      surcharge_percentage: 15,
      required_documents: ['passport', 'drivers_license', 'cross_border_permit'],
      insurance_requirements: ['third_party', 'comprehensive']
    }
  },
  suv: {
    make: 'Ford',
    model: 'Everest',
    year: 2023,
    category: 'suv',
    registration: 'TEST002GP',
    specifications: {
      engine: {
        type: 'V6',
        displacement: 3.2,
        fuel_type: 'diesel'
      },
      transmission: 'automatic',
      drivetrain: 'awd',
      seats: 7,
      doors: 5,
      features: ['GPS', 'Bluetooth', 'AC', '4WD'],
      safety_features: ['ABS', 'Airbags', 'ESC', 'Hill Assist'],
      entertainment: ['Touchscreen', 'USB', 'Bluetooth', 'Apple CarPlay'],
      comfort_features: ['AC', 'Power Windows', 'Leather Seats', 'Cruise Control']
    },
    pricing: {
      base_daily_rate: 750,
      currency: 'ZAR',
      security_deposit: 5000,
      cross_border_surcharge: 250
    },
    cross_border_config: {
      allowed: true,
      countries: ['BW', 'NA', 'SZ', 'LS', 'ZM', 'MW'],
      surcharge_percentage: 20,
      required_documents: ['passport', 'drivers_license', 'cross_border_permit', 'vehicle_registration'],
      insurance_requirements: ['third_party', 'comprehensive', 'cross_border_coverage']
    }
  }
};

export const testBookings = {
  domestic: {
    pickup_location: {
      latitude: -26.2041,
      longitude: 28.0473,
      address: 'OR Tambo International Airport, Johannesburg, South Africa'
    },
    dropoff_location: {
      latitude: -26.2041,
      longitude: 28.0473,
      address: 'OR Tambo International Airport, Johannesburg, South Africa'
    },
    date_range: {
      start_date: '2024-02-15',
      end_date: '2024-02-20'
    }
  },
  crossBorder: {
    pickup_location: {
      latitude: -26.2041,
      longitude: 28.0473,
      address: 'OR Tambo International Airport, Johannesburg, South Africa'
    },
    dropoff_location: {
      latitude: -24.6282,
      longitude: 25.9231,
      address: 'Sir Seretse Khama International Airport, Gaborone, Botswana'
    },
    date_range: {
      start_date: '2024-03-01',
      end_date: '2024-03-07'
    },
    destination_countries: ['BW']
  }
};

export const testPaymentMethods = {
  creditCard: {
    type: 'credit_card',
    card_number: '4111111111111111',
    expiry_month: '12',
    expiry_year: '2025',
    cvv: '123',
    cardholder_name: 'John Doe'
  },
  bankTransfer: {
    type: 'bank_transfer',
    bank_name: 'Standard Bank',
    account_number: '123456789',
    branch_code: '051001'
  }
};

export const testInsuranceProducts = {
  basic: {
    name: 'Basic Coverage',
    coverage_type: 'third_party',
    premium_amount: 150,
    coverage_limits: {
      liability_limit: 1000000,
      collision_deductible: 5000,
      comprehensive_deductible: 2500
    }
  },
  comprehensive: {
    name: 'Comprehensive Coverage',
    coverage_type: 'comprehensive',
    premium_amount: 350,
    coverage_limits: {
      liability_limit: 2000000,
      collision_deductible: 2500,
      comprehensive_deductible: 1000,
      personal_injury: 500000
    }
  }
};

export const sadcCountries = [
  { code: 'AO', name: 'Angola' },
  { code: 'BW', name: 'Botswana' },
  { code: 'CD', name: 'Democratic Republic of Congo' },
  { code: 'SZ', name: 'Eswatini' },
  { code: 'LS', name: 'Lesotho' },
  { code: 'MG', name: 'Madagascar' },
  { code: 'MW', name: 'Malawi' },
  { code: 'MU', name: 'Mauritius' },
  { code: 'MZ', name: 'Mozambique' },
  { code: 'NA', name: 'Namibia' },
  { code: 'SC', name: 'Seychelles' },
  { code: 'ZA', name: 'South Africa' },
  { code: 'TZ', name: 'Tanzania' },
  { code: 'ZM', name: 'Zambia' },
  { code: 'ZW', name: 'Zimbabwe' }
];