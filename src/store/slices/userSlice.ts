import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { UserProfile, UserVerificationStatus } from '../schemas/user-schemas'

interface User {
  id: number
  email: string
  phone?: string
  profile: UserProfile
  verification_status: UserVerificationStatus
  created_at: string
  updated_at: string
}

export interface UserState {
  user: User | null
  isAuthenticated: boolean
  loading: boolean
  error: string | null
}

const initialState: UserState = {
  user: null,
  isAuthenticated: false,
  loading: false,
  error: null,
}

export const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload
      state.isAuthenticated = true
      state.error = null
    },
    clearUser: (state) => {
      state.user = null
      state.isAuthenticated = false
      state.error = null
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload
    },
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload
      state.loading = false
    },
    updateProfile: (state, action: PayloadAction<Partial<UserProfile>>) => {
      if (state.user) {
        state.user.profile = { ...state.user.profile, ...action.payload }
      }
    },
  },
})