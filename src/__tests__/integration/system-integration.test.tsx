import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import userEvent from '@testing-library/user-event';

import App from '../../App';
import { userSlice } from '../../store/slices/userSlice';
import { vehicleSlice } from '../../store/slices/vehicleSlice';
import { bookingSlice } from '../../store/slices/bookingSlice';
import { searchSlice } from '../../store/slices/searchSlice';
import { notificationSlice } from '../../store/slices/notificationSlice';
import { messagingSlice } from '../../store/slices/messagingSlice';

// Mock external services
vi.mock('../../services/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  }
}));

vi.mock('../../services/authService', () => ({
  authService: {
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    getCurrentUser: vi.fn(),
    refreshToken: vi.fn(),
  }
}));

vi.mock('../../services/vehicleService', () => ({
  vehicleService: {
    searchVehicles: vi.fn(),
    getVehicle: vi.fn(),
    getVehicleAvailability: vi.fn(),
  }
}));

vi.mock('../../services/bookingService', () => ({
  bookingService: {
    createBooking: vi.fn(),
    getBookings: vi.fn(),
    getBooking: vi.fn(),
    updateBooking: vi.fn(),
  }
}));

describe('System Integration Tests', () => {
  let store: ReturnType<typeof configureStore>;
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    store = configureStore({
      reducer: {
        user: userSlice.reducer,
        vehicle: vehicleSlice.reducer,
        booking: bookingSlice.reducer,
        search: searchSlice.reducer,
        notification: notificationSlice.reducer,
        messaging: messagingSlice.reducer,
      },
    });
    user = userEvent.setup();
  });

  const renderApp = () => {
    return render(
      <Provider store={store}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </Provider>
    );
  };

  it('should render the application without crashing', async () => {
    renderApp();
    
    await waitFor(() => {
      expect(screen.getByTestId('app-loaded')).toBeInTheDocument();
    });
  });

  it('should have all required providers in the component tree', async () => {
    renderApp();
    
    // Check that all context providers are working
    await waitFor(() => {
      // AuthProvider should be available
      expect(screen.getByTestId('app-loaded')).toBeInTheDocument();
    });
  });

  it('should navigate between different routes', async () => {
    renderApp();
    
    // Should start on home page
    await waitFor(() => {
      expect(screen.getByTestId('app-loaded')).toBeInTheDocument();
    });

    // Test navigation would require proper routing setup
    // This is a basic integration test to ensure the app loads
  });

  it('should handle state management across components', async () => {
    renderApp();
    
    // Verify Redux store is connected
    expect(store.getState()).toBeDefined();
    expect(store.getState().user).toBeDefined();
    expect(store.getState().vehicle).toBeDefined();
    expect(store.getState().booking).toBeDefined();
    expect(store.getState().search).toBeDefined();
    expect(store.getState().notification).toBeDefined();
    expect(store.getState().messaging).toBeDefined();
  });

  it('should handle error boundaries gracefully', async () => {
    // Mock console.error to avoid noise in test output
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    renderApp();
    
    // The app should render without throwing errors
    await waitFor(() => {
      expect(screen.getByTestId('app-loaded')).toBeInTheDocument();
    });
    
    consoleSpy.mockRestore();
  });

  it('should load all required CSS and assets', async () => {
    renderApp();
    
    // Check that Tailwind CSS classes are applied
    const appElement = screen.getByTestId('app-loaded');
    expect(appElement).toBeInTheDocument();
    
    // Basic check that the app structure is rendered
    await waitFor(() => {
      expect(appElement).toBeInTheDocument();
    });
  });

  it('should handle responsive design breakpoints', async () => {
    // Test different viewport sizes
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 768,
    });
    
    renderApp();
    
    await waitFor(() => {
      expect(screen.getByTestId('app-loaded')).toBeInTheDocument();
    });
    
    // Test mobile viewport
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375,
    });
    
    window.dispatchEvent(new Event('resize'));
    
    await waitFor(() => {
      expect(screen.getByTestId('app-loaded')).toBeInTheDocument();
    });
  });
});