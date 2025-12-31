import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { Layout } from './components/layout/Layout'
import { HomePage } from './pages/HomePage'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'
import DashboardPage from './pages/DashboardPage'
import { SearchPage } from './pages/SearchPage'
import { BookingsPage } from './pages/BookingsPage'
import { VehicleDetailPage } from './pages/VehicleDetailPage'

function App() {
  return (
    <div data-testid="app-loaded" className="min-h-screen bg-gray-50">
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Layout><HomePage /></Layout>} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/search" element={<Layout><SearchPage /></Layout>} />
          <Route path="/vehicles/:id" element={<Layout><VehicleDetailPage /></Layout>} />
          
          {/* Authenticated routes */}
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/bookings" element={<Layout><BookingsPage /></Layout>} />
          
          {/* Catch all route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </div>
  )
}

export default App