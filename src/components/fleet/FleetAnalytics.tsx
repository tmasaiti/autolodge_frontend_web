import React, { useState, useEffect } from 'react';
import { CurrencyCode } from '@autolodge/shared';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { CurrencyDisplay } from '../ui/CurrencyDisplay';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  Car,
  DollarSign,
  Users,
  Clock,
  MapPin,
  Star,
  AlertCircle,
  Download,
  Filter,
  X
} from 'lucide-react';

interface FleetAnalyticsProps {
  operatorId: number;
  onClose: () => void;
}

interface AnalyticsData {
  overview: {
    total_revenue: number;
    total_bookings: number;
    average_rating: number;
    occupancy_rate: number;
    active_vehicles: number;
  };
  revenue_trend: {
    period: string;
    amount: number;
    change_percentage: number;
  }[];
  vehicle_performance: {
    vehicle_id: number;
    registration: string;
    make: string;
    model: string;
    bookings: number;
    revenue: number;
    occupancy_rate: number;
    average_rating: number;
  }[];
  booking_trends: {
    date: string;
    bookings: number;
    revenue: number;
  }[];
  popular_locations: {
    city: string;
    bookings: number;
    revenue: number;
  }[];
  customer_insights: {
    repeat_customers: number;
    average_rental_days: number;
    peak_booking_hours: string[];
    popular_vehicle_categories: { category: string; percentage: number }[];
  };
}

export const FleetAnalytics: React.FC<FleetAnalyticsProps> = ({
  operatorId,
  onClose
}) => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [activeTab, setActiveTab] = useState<'overview' | 'vehicles' | 'trends' | 'insights'>('overview');

  useEffect(() => {
    loadAnalytics();
  }, [operatorId, timeRange]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      // Mock analytics data - in real app this would call the API
      const mockAnalytics: AnalyticsData = {
        overview: {
          total_revenue: 45750,
          total_bookings: 127,
          average_rating: 4.6,
          occupancy_rate: 73,
          active_vehicles: 8
        },
        revenue_trend: [
          { period: 'Week 1', amount: 8500, change_percentage: 12 },
          { period: 'Week 2', amount: 9200, change_percentage: 8 },
          { period: 'Week 3', amount: 11300, change_percentage: 23 },
          { period: 'Week 4', amount: 16750, change_percentage: 48 }
        ],
        vehicle_performance: [
          {
            vehicle_id: 1,
            registration: 'CA 123 456',
            make: 'BMW',
            model: '3 Series',
            bookings: 23,
            revenue: 15750,
            occupancy_rate: 85,
            average_rating: 4.8
          },
          {
            vehicle_id: 2,
            registration: 'CA 789 012',
            make: 'Toyota',
            model: 'Fortuner',
            bookings: 19,
            revenue: 16150,
            occupancy_rate: 78,
            average_rating: 4.5
          },
          {
            vehicle_id: 3,
            registration: 'CA 345 678',
            make: 'Volkswagen',
            model: 'Polo',
            bookings: 31,
            revenue: 8900,
            occupancy_rate: 92,
            average_rating: 4.3
          }
        ],
        booking_trends: [
          { date: '2024-01-01', bookings: 3, revenue: 1950 },
          { date: '2024-01-02', bookings: 5, revenue: 3250 },
          { date: '2024-01-03', bookings: 2, revenue: 1300 },
          { date: '2024-01-04', bookings: 7, revenue: 4550 },
          { date: '2024-01-05', bookings: 4, revenue: 2600 }
        ],
        popular_locations: [
          { city: 'Cape Town', bookings: 45, revenue: 29250 },
          { city: 'Johannesburg', bookings: 38, revenue: 24700 },
          { city: 'Durban', bookings: 22, revenue: 14300 },
          { city: 'Pretoria', bookings: 15, revenue: 9750 }
        ],
        customer_insights: {
          repeat_customers: 34,
          average_rental_days: 3.2,
          peak_booking_hours: ['09:00', '14:00', '16:00'],
          popular_vehicle_categories: [
            { category: 'Sedan', percentage: 45 },
            { category: 'SUV', percentage: 32 },
            { category: 'Hatchback', percentage: 23 }
          ]
        }
      };

      setAnalytics(mockAnalytics);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatPercentageChange = (change: number) => {
    const isPositive = change >= 0;
    const Icon = isPositive ? TrendingUp : TrendingDown;
    const colorClass = isPositive ? 'text-green-600' : 'text-red-600';
    
    return (
      <span className={`flex items-center gap-1 text-sm ${colorClass}`}>
        <Icon className="w-3 h-3" />
        {Math.abs(change)}%
      </span>
    );
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'vehicles', label: 'Vehicle Performance', icon: Car },
    { id: 'trends', label: 'Booking Trends', icon: Calendar },
    { id: 'insights', label: 'Customer Insights', icon: Users }
  ];

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="text-center py-12">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to load analytics</h3>
          <p className="text-gray-600 mb-4">Unable to retrieve analytics data at this time.</p>
          <Button onClick={loadAnalytics}>Try Again</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Fleet Analytics</h2>
          <p className="text-gray-600 mt-1">Performance insights for your vehicle fleet</p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Time Range Selector */}
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
          
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          
          <Button variant="ghost" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-8">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Card padding="md">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  <CurrencyDisplay amount={analytics.overview.total_revenue} currency="ZAR" />
                </div>
                <div className="text-sm text-gray-600">Total Revenue</div>
              </div>
            </Card>
            
            <Card padding="md">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{analytics.overview.total_bookings}</div>
                <div className="text-sm text-gray-600">Total Bookings</div>
              </div>
            </Card>
            
            <Card padding="md">
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600 flex items-center justify-center gap-1">
                  <Star className="w-5 h-5 fill-current" />
                  {analytics.overview.average_rating}
                </div>
                <div className="text-sm text-gray-600">Avg Rating</div>
              </div>
            </Card>
            
            <Card padding="md">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{analytics.overview.occupancy_rate}%</div>
                <div className="text-sm text-gray-600">Occupancy Rate</div>
              </div>
            </Card>
            
            <Card padding="md">
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{analytics.overview.active_vehicles}</div>
                <div className="text-sm text-gray-600">Active Vehicles</div>
              </div>
            </Card>
          </div>

          {/* Revenue Trend */}
          <Card padding="lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Trend</h3>
            <div className="space-y-3">
              {analytics.revenue_trend.map((period, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="font-medium text-gray-900">{period.period}</div>
                  <div className="flex items-center gap-4">
                    <CurrencyDisplay amount={period.amount} currency="ZAR" />
                    {formatPercentageChange(period.change_percentage)}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'vehicles' && (
        <div className="space-y-6">
          <Card padding="lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Vehicle Performance</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Vehicle</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Bookings</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Revenue</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Occupancy</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Rating</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.vehicle_performance.map((vehicle, index) => (
                    <tr key={index} className="border-b border-gray-100">
                      <td className="py-3 px-4">
                        <div>
                          <div className="font-medium text-gray-900">
                            {vehicle.make} {vehicle.model}
                          </div>
                          <div className="text-sm text-gray-500">{vehicle.registration}</div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-900">{vehicle.bookings}</td>
                      <td className="py-3 px-4">
                        <CurrencyDisplay amount={vehicle.revenue} currency="ZAR" size="sm" />
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          vehicle.occupancy_rate >= 80 
                            ? 'bg-green-100 text-green-800'
                            : vehicle.occupancy_rate >= 60
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {vehicle.occupancy_rate}%
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-yellow-400 fill-current" />
                          <span className="text-gray-900">{vehicle.average_rating}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'trends' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Popular Locations */}
            <Card padding="lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Popular Locations
              </h3>
              <div className="space-y-3">
                {analytics.popular_locations.map((location, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="font-medium text-gray-900">{location.city}</div>
                    <div className="text-right">
                      <div className="font-medium text-gray-900">{location.bookings} bookings</div>
                      <div className="text-sm text-gray-500">
                        <CurrencyDisplay amount={location.revenue} currency="ZAR" size="sm" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Booking Trends Chart Placeholder */}
            <Card padding="lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Bookings</h3>
              <div className="h-48 bg-gray-50 rounded-lg flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <BarChart3 className="w-8 h-8 mx-auto mb-2" />
                  <div className="text-sm">Chart visualization would go here</div>
                  <div className="text-xs">Integration with charting library needed</div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {activeTab === 'insights' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Customer Insights */}
            <Card padding="lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Users className="w-5 h-5" />
                Customer Insights
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Repeat Customers</span>
                  <span className="font-medium text-gray-900">{analytics.customer_insights.repeat_customers}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Average Rental Days</span>
                  <span className="font-medium text-gray-900">{analytics.customer_insights.average_rental_days} days</span>
                </div>
                <div>
                  <span className="text-gray-600 block mb-2">Peak Booking Hours</span>
                  <div className="flex gap-2">
                    {analytics.customer_insights.peak_booking_hours.map((hour, index) => (
                      <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                        {hour}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </Card>

            {/* Popular Categories */}
            <Card padding="lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Popular Vehicle Categories</h3>
              <div className="space-y-3">
                {analytics.customer_insights.popular_vehicle_categories.map((category, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-gray-900">{category.category}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${category.percentage}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-600 w-8">{category.percentage}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};