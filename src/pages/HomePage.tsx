import React from 'react';
import { Link } from 'react-router-dom';
import { Car } from 'lucide-react';

export function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-white rounded-xl flex items-center justify-center mb-8">
            <Car className="h-8 w-8 text-blue-600" />
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Welcome to AutoLodge
          </h1>
          <p className="text-xl md:text-2xl mb-12 text-blue-100 max-w-3xl mx-auto">
            Your trusted marketplace for cross-border vehicle rentals in the SADC region.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              to="/login"
              className="bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              Get Started
            </Link>
            <Link 
              to="/search"
              className="border-2 border-white text-white px-8 py-4 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors"
            >
              Browse Vehicles
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}