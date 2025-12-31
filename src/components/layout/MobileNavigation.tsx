import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Menu, 
  X, 
  Home, 
  Search, 
  Calendar, 
  User, 
  MessageCircle,
  Bell,
  Settings,
  LogOut,
  Car
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { useAuth } from '../../contexts/AuthContext';

export interface MobileNavigationProps {
  className?: string;
}

export const MobileNavigation: React.FC<MobileNavigationProps> = ({ className }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { isAuthenticated, user, logout } = useAuth();
  const location = useLocation();

  const handleLogout = async () => {
    try {
      await logout();
      setIsOpen(false);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const navigationItems = [
    { to: '/', icon: Home, label: 'Home' },
    { to: '/search', icon: Search, label: 'Search' },
    ...(isAuthenticated ? [
      { to: '/dashboard', icon: Calendar, label: 'Dashboard' },
      { to: '/messages', icon: MessageCircle, label: 'Messages' },
      { to: '/notifications', icon: Bell, label: 'Notifications' },
      { to: '/profile', icon: User, label: 'Profile' },
    ] : []),
  ];

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        className={cn(
          'md:hidden p-2 rounded-lg text-neutral-700 hover:text-primary-600 hover:bg-neutral-100',
          'min-h-[44px] min-w-[44px] flex items-center justify-center',
          'transition-colors duration-200',
          className
        )}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle mobile menu"
      >
        {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Mobile Menu Drawer */}
      <div
        className={cn(
          'fixed top-0 right-0 h-full w-80 max-w-[85vw] bg-white shadow-xl z-50',
          'transform transition-transform duration-300 ease-in-out md:hidden',
          isOpen ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <Link 
              to="/" 
              className="flex items-center space-x-2"
              onClick={() => setIsOpen(false)}
            >
              <Car className="h-8 w-8 text-primary-600" />
              <span className="text-xl font-bold text-neutral-900">AutoLodge</span>
            </Link>
            <button
              className="p-2 rounded-lg text-neutral-700 hover:bg-neutral-100"
              onClick={() => setIsOpen(false)}
              aria-label="Close menu"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* User Info */}
          {isAuthenticated && user && (
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-primary-600 rounded-full flex items-center justify-center">
                  <User className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">
                    {user.profile.first_name} {user.profile.last_name}
                  </p>
                  <p className="text-sm text-gray-500">{user.email}</p>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Items */}
          <nav className="flex-1 overflow-y-auto py-4">
            <div className="space-y-1 px-4">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.to;
                
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={cn(
                      'flex items-center space-x-3 px-4 py-3 rounded-lg text-base font-medium',
                      'min-h-[44px] transition-colors duration-200',
                      isActive
                        ? 'bg-primary-100 text-primary-700'
                        : 'text-gray-700 hover:bg-gray-100'
                    )}
                    onClick={() => setIsOpen(false)}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}

              {/* Additional Links */}
              <div className="pt-4 mt-4 border-t border-gray-200">
                <Link
                  to="/wizard-demo"
                  className="flex items-center space-x-3 px-4 py-3 rounded-lg text-base font-medium text-accent-600 hover:bg-accent-50 min-h-[44px]"
                  onClick={() => setIsOpen(false)}
                >
                  <span className="text-lg">🎯</span>
                  <span>Wizard Demo</span>
                </Link>
                
                <Link
                  to="/become-operator"
                  className="flex items-center space-x-3 px-4 py-3 rounded-lg text-base font-medium text-accent-600 hover:bg-accent-50 min-h-[44px]"
                  onClick={() => setIsOpen(false)}
                >
                  <span className="text-lg">⭐</span>
                  <span>Become an Operator</span>
                </Link>

                {user?.verification_status?.verification_level === 'operator' && (
                  <Link
                    to="/admin"
                    className="flex items-center space-x-3 px-4 py-3 rounded-lg text-base font-medium text-red-600 hover:bg-red-50 min-h-[44px]"
                    onClick={() => setIsOpen(false)}
                  >
                    <Settings className="h-5 w-5" />
                    <span>Admin Panel</span>
                  </Link>
                )}
              </div>
            </div>
          </nav>

          {/* Footer Actions */}
          <div className="p-4 border-t border-gray-200">
            {isAuthenticated ? (
              <button
                onClick={handleLogout}
                className="flex items-center space-x-3 w-full px-4 py-3 rounded-lg text-base font-medium text-red-600 hover:bg-red-50 min-h-[44px]"
              >
                <LogOut className="h-5 w-5" />
                <span>Sign Out</span>
              </button>
            ) : (
              <div className="space-y-2">
                <Link
                  to="/login"
                  className="flex items-center justify-center w-full px-4 py-3 rounded-lg text-base font-medium text-primary-600 border border-primary-600 hover:bg-primary-50 min-h-[44px]"
                  onClick={() => setIsOpen(false)}
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="flex items-center justify-center w-full px-4 py-3 rounded-lg text-base font-medium text-white bg-primary-600 hover:bg-primary-700 min-h-[44px]"
                  onClick={() => setIsOpen(false)}
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export interface BottomNavigationProps {
  className?: string;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({ className }) => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) return null;

  const bottomNavItems = [
    { to: '/', icon: Home, label: 'Home' },
    { to: '/search', icon: Search, label: 'Search' },
    { to: '/dashboard', icon: Calendar, label: 'Bookings' },
    { to: '/messages', icon: MessageCircle, label: 'Messages' },
    { to: '/profile', icon: User, label: 'Profile' },
  ];

  return (
    <nav
      className={cn(
        'fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-30',
        'md:hidden', // Hide on desktop
        className
      )}
    >
      <div className="flex items-center justify-around py-2">
        {bottomNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.to;
          
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                'flex flex-col items-center justify-center px-3 py-2 rounded-lg',
                'min-h-[60px] min-w-[60px] transition-colors duration-200',
                isActive
                  ? 'text-primary-600'
                  : 'text-gray-500 hover:text-gray-700'
              )}
            >
              <Icon className="h-5 w-5 mb-1" />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};