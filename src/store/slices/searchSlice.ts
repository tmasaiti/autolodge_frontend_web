import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface PriceRange {
  min: number
  max: number
  currency: string
}

export interface SearchFilters {
  vehicle_category?: string
  price_range?: PriceRange
  cross_border_capable?: boolean
  features?: string[]
  operator_verification_level?: string
  transmission?: string
  fuel_type?: string
  seats?: number
}

export interface SearchParams {
  location: {
    latitude: number
    longitude: number
    address: string
    city: string
    country: string
  }
  date_range: {
    start_date: string
    end_date: string
  }
  filters: SearchFilters
  sort_by: 'price' | 'rating' | 'distance' | 'availability'
  radius_km: number
}

interface SavedSearch {
  id: number
  user_id: number
  name: string
  query: SearchParams
  alerts_enabled: boolean
  last_run: string
}

export interface SearchResult {
  vehicle_id: number
  distance_km: number
  daily_rate: number
  currency: string
  availability_score: number
  operator_rating: number
}

export interface SearchState {
  currentSearch: SearchParams | null
  searchResults: SearchResult[]
  savedSearches: SavedSearch[]
  loading: boolean
  error: string | null
  totalResults: number
  hasMore: boolean
}

const initialState: SearchState = {
  currentSearch: null,
  searchResults: [],
  savedSearches: [],
  loading: false,
  error: null,
  totalResults: 0,
  hasMore: false,
}

export const searchSlice = createSlice({
  name: 'search',
  initialState,
  reducers: {
    setCurrentSearch: (state, action: PayloadAction<SearchParams>) => {
      state.currentSearch = action.payload
    },
    updateSearchFilters: (state, action: PayloadAction<Partial<SearchFilters>>) => {
      if (state.currentSearch) {
        state.currentSearch.filters = { ...state.currentSearch.filters, ...action.payload }
      }
    },
    setSearchResults: (state, action: PayloadAction<{ results: SearchResult[], total: number, hasMore: boolean }>) => {
      state.searchResults = action.payload.results
      state.totalResults = action.payload.total
      state.hasMore = action.payload.hasMore
      state.error = null
    },
    appendSearchResults: (state, action: PayloadAction<{ results: SearchResult[], hasMore: boolean }>) => {
      state.searchResults.push(...action.payload.results)
      state.hasMore = action.payload.hasMore
    },
    setSavedSearches: (state, action: PayloadAction<SavedSearch[]>) => {
      state.savedSearches = action.payload
    },
    addSavedSearch: (state, action: PayloadAction<SavedSearch>) => {
      state.savedSearches.push(action.payload)
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload
    },
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload
      state.loading = false
    },
    clearSearch: (state) => {
      state.currentSearch = null
      state.searchResults = []
      state.totalResults = 0
      state.hasMore = false
    },
  },
})