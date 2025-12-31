import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface VehicleSpecifications {
  engine: {
    type: string
    displacement: number
    fuel_type: string
  }
  transmission: string
  seats: number
  doors: number
  features: string[]
  safety_features: string[]
  entertainment: string[]
}

interface VehiclePricing {
  base_daily_rate: number
  currency: string
  seasonal_adjustments: {
    peak_multiplier: number
    off_peak_multiplier: number
  }
  distance_pricing: {
    included_km_per_day: number
    excess_km_rate: number
  }
  cross_border_surcharge: number
  security_deposit: number
}

interface CrossBorderConfig {
  allowed: boolean
  countries: string[]
  surcharge_percentage: number
  required_documents: string[]
  insurance_requirements: string[]
}

interface Vehicle {
  id: number
  operator_id: number
  registration: string
  category: string
  make: string
  model: string
  year: number
  color?: string
  vin?: string
  specifications: VehicleSpecifications
  pricing: VehiclePricing
  cross_border_config: CrossBorderConfig
  status: string
  location: {
    latitude: number
    longitude: number
    address: string
    city: string
    country: string
  }
  description?: string
  photos: string[]
}

export interface VehicleState {
  vehicles: Vehicle[]
  selectedVehicle: Vehicle | null
  loading: boolean
  error: string | null
}

const initialState: VehicleState = {
  vehicles: [],
  selectedVehicle: null,
  loading: false,
  error: null,
}

export const vehicleSlice = createSlice({
  name: 'vehicle',
  initialState,
  reducers: {
    setVehicles: (state, action: PayloadAction<Vehicle[]>) => {
      state.vehicles = action.payload
      state.error = null
    },
    setSelectedVehicle: (state, action: PayloadAction<Vehicle>) => {
      state.selectedVehicle = action.payload
    },
    clearSelectedVehicle: (state) => {
      state.selectedVehicle = null
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload
    },
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload
      state.loading = false
    },
    addVehicle: (state, action: PayloadAction<Vehicle>) => {
      state.vehicles.push(action.payload)
    },
    updateVehicle: (state, action: PayloadAction<Vehicle>) => {
      const index = state.vehicles.findIndex(v => v.id === action.payload.id)
      if (index !== -1) {
        state.vehicles[index] = action.payload
      }
    },
  },
})