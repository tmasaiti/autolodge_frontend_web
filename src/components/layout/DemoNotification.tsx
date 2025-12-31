import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { X, Zap, Users } from 'lucide-react';

export const DemoNotification: React.FC = () => {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <div className="bg-gradient-to-r from-accent-500 to-accent-600 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-3">
          <div className="flex items-center space-x-4">
            <Zap className="h-5 w-5" />
            <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-6">
              <span className="font-medium">
                🎉 New Wizard Components Available!
              </span>
              <div className="flex items-center space-x-4 mt-2 sm:mt-0">
                <Link 
                  to="/wizard-demo" 
                  className="inline-flex items-center space-x-1 bg-white bg-opacity-20 hover:bg-opacity-30 px-3 py-1 rounded-full text-sm font-medium transition-colors"
                >
                  <Zap className="h-4 w-4" />
                  <span>Try Booking Wizard</span>
                </Link>
                <Link 
                  to="/become-operator" 
                  className="inline-flex items-center space-x-1 bg-white bg-opacity-20 hover:bg-opacity-30 px-3 py-1 rounded-full text-sm font-medium transition-colors"
                >
                  <Users className="h-4 w-4" />
                  <span>Operator Onboarding</span>
                </Link>
              </div>
            </div>
          </div>
          
          <button
            onClick={() => setIsVisible(false)}
            className="p-1 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};