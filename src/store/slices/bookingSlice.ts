import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface DateRange {
  start_date: string
  end_date: string
  actual_start_date?: string
  actual_end_date?: string
}

interface GeoLocation {
  latitude: number
  longitude: number
  address: string
  city: string
  country: string
}

interface TaxBreakdown {
  type: string
  rate: number
  amount: number
}

interface BookingPricing {
  daily_rate: number
  total_days: number
  subtotal: number
  taxes: TaxBreakdown[]
  platform_fee: number
  security_deposit: number
  total_amount: number
  currency: string
}

interface CrossBorderDetails {
  destination_countries: string[]
  permits_required: boolean
  additional_insurance: boolean
  surcharge_amount: number
}

interface BookingEvent {
  id: number
  booking_id: number
  type: string
  timestamp: string
  description: string
  performed_by: string
  metadata?: Record<string, any>
}

interface BookingData {
  id: number
  renter_id: number
  vehicle_id: number
  operator_id: number
  status: string
  date_range: DateRange
  locations: {
    pickup: GeoLocation
    dropoff: GeoLocation
  }
  pricing: BookingPricing
  cross_border?: CrossBorderDetails
  timeline: BookingEvent[]
}

interface BookingDraft {
  vehicle_id?: number
  date_range?: DateRange
  locations?: {
    pickup?: GeoLocation
    dropoff?: GeoLocation
  }
  cross_border?: CrossBorderDetails
  insurance_selection?: any
  payment_method?: any
}

export interface BookingState {
  bookings: BookingData[]
  currentBooking: BookingDraft | null
  selectedBooking: BookingData | null
  loading: boolean
  error: string | null
}

const initialState: BookingState = {
  bookings: [],
  currentBooking: null,
  selectedBooking: null,
  loading: false,
  error: null,
}

export const bookingSlice = createSlice({
  name: 'booking',
  initialState,
  reducers: {
    setBookings: (state, action: PayloadAction<BookingData[]>) => {
      state.bookings = action.payload
      state.error = null
    },
    setCurrentBooking: (state, action: PayloadAction<BookingDraft>) => {
      state.currentBooking = action.payload
    },
    updateCurrentBooking: (state, action: PayloadAction<Partial<BookingDraft>>) => {
      if (state.currentBooking) {
        state.currentBooking = { ...state.currentBooking, ...action.payload }
      } else {
        state.currentBooking = action.payload
      }
    },
    clearCurrentBooking: (state) => {
      state.currentBooking = null
    },
    setSelectedBooking: (state, action: PayloadAction<BookingData>) => {
      state.selectedBooking = action.payload
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload
    },
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload
      state.loading = false
    },
    addBooking: (state, action: PayloadAction<BookingData>) => {
      state.bookings.push(action.payload)
    },
  },
})