import { configureStore } from '@reduxjs/toolkit'
import { userSlice } from './slices/userSlice'
import { vehicleSlice } from './slices/vehicleSlice'
import { bookingSlice } from './slices/bookingSlice'
import { searchSlice } from './slices/searchSlice'
import { notificationSlice } from './slices/notificationSlice'
import { messagingSlice } from './slices/messagingSlice'

export const store = configureStore({
  reducer: {
    user: userSlice.reducer,
    vehicle: vehicleSlice.reducer,
    booking: bookingSlice.reducer,
    search: searchSlice.reducer,
    notifications: notificationSlice.reducer,
    messaging: messagingSlice.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
      },
    }),
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch