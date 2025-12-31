import { Link } from 'react-router-dom'
import { Car, User, LogOut } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { NotificationBell } from '../notifications/NotificationBell'
import { MobileNavigation } from './MobileNavigation'

export function Header() {
  const { isAuthenticated, user, logout } = useAuth()

  const handleLogout = async () => {
    try {
      await logout()
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  return (
    <header className="bg-white shadow-sm border-b border-neutral-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 flex-shrink-0">
            <Car className="h-8 w-8 text-primary-600" />
            <span className="text-xl font-bold text-neutral-900">AutoLodge</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link to="/search" className="text-neutral-700 hover:text-primary-600 transition-colors">
              Search Vehicles
            </Link>
            <Link to="/wizard-demo" className="text-neutral-700 hover:text-accent-600 transition-colors font-medium">
              🎯 Wizard Demo
            </Link>
            <Link to="/how-it-works" className="text-neutral-700 hover:text-primary-600 transition-colors">
              How It Works
            </Link>
            <Link to="/become-operator" className="text-neutral-700 hover:text-accent-600 transition-colors font-medium">
              ⭐ Become an Operator
            </Link>
          </nav>

          {/* Desktop User Actions */}
          <div className="hidden md:flex items-center space-x-4">
            {isAuthenticated ? (
              <div className="flex items-center space-x-4">
                <Link to="/dashboard" className="text-neutral-700 hover:text-primary-600 transition-colors">
                  Dashboard
                </Link>
                
                <Link to="/messages" className="text-neutral-700 hover:text-primary-600 transition-colors">
                  Messages
                </Link>
                
                {/* Notification Bell */}
                <NotificationBell />
                
                <div className="relative group">
                  <button className="flex items-center space-x-2 text-neutral-700 hover:text-primary-600 transition-colors">
                    <User className="h-5 w-5" />
                    <span className="hidden lg:inline">{user?.profile.first_name}</span>
                  </button>
                  
                  {/* Dropdown Menu */}
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                    <div className="py-1">
                      <Link
                        to="/profile"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Profile Settings
                      </Link>
                      <Link
                        to="/dashboard"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Dashboard
                      </Link>
                      {/* Admin access for operators and above */}
                      {user?.verification_status?.verification_level === 'operator' && (
                        <>
                          <hr className="my-1" />
                          <Link
                            to="/admin"
                            className="block px-4 py-2 text-sm text-red-700 hover:bg-red-50 font-medium"
                          >
                            Admin Panel
                          </Link>
                        </>
                      )}
                      <hr className="my-1" />
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                      >
                        <LogOut className="h-4 w-4" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link to="/login" className="text-neutral-700 hover:text-primary-600 transition-colors">
                  Sign In
                </Link>
                <Link 
                  to="/register" 
                  className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
          
          {/* Mobile Navigation */}
          <MobileNavigation />
        </div>
      </div>
    </header>
  )
}