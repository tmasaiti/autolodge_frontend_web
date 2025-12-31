import { Link } from 'react-router-dom'
import { Car } from 'lucide-react'

export function Footer() {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <Link to="/" className="flex items-center space-x-2 mb-4">
              <Car className="h-8 w-8 text-primary-400" />
              <span className="text-xl font-bold">AutoLodge</span>
            </Link>
            <p className="text-gray-300 mb-4">
              The leading vehicle rental marketplace in the SADC region. 
              Connecting travelers with trusted operators across Southern Africa.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                Privacy Policy
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                Terms of Service
              </a>
            </div>
          </div>

          {/* For Renters */}
          <div>
            <h3 className="text-lg font-semibold mb-4">For Renters</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/search" className="text-gray-300 hover:text-white transition-colors">
                  Find Vehicles
                </Link>
              </li>
              <li>
                <Link to="/how-it-works" className="text-gray-300 hover:text-white transition-colors">
                  How It Works
                </Link>
              </li>
              <li>
                <Link to="/insurance" className="text-gray-300 hover:text-white transition-colors">
                  Insurance Options
                </Link>
              </li>
              <li>
                <Link to="/cross-border" className="text-gray-300 hover:text-white transition-colors">
                  Cross-Border Travel
                </Link>
              </li>
            </ul>
          </div>

          {/* For Operators */}
          <div>
            <h3 className="text-lg font-semibold mb-4">For Operators</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/become-operator" className="text-gray-300 hover:text-white transition-colors">
                  Become an Operator
                </Link>
              </li>
              <li>
                <Link to="/operator-guide" className="text-gray-300 hover:text-white transition-colors">
                  Operator Guide
                </Link>
              </li>
              <li>
                <Link to="/pricing" className="text-gray-300 hover:text-white transition-colors">
                  Pricing & Fees
                </Link>
              </li>
              <li>
                <Link to="/support" className="text-gray-300 hover:text-white transition-colors">
                  Support
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
          <p>&copy; 2024 AutoLodge. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}