/**
 * Admin Dashboard Component
 * Main overview dashboard for administrators
 */

import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Car, 
  FileText, 
  AlertTriangle, 
  TrendingUp, 
  DollarSign,
  Shield,
  Activity
} from 'lucide-react';
import { Card } from '../ui/Card';

interface DashboardStats {
  totalUsers: number;
  totalOperators: number;
  totalVehicles: number;
  activeBookings: number;
  pendingDisputes: number;
  monthlyRevenue: number;
  complianceScore: number;
  systemHealth: number;
}

interface RecentActivity {
  id: string;
  type: 'user_registration' | 'booking_created' | 'dispute_filed' | 'compliance_alert';
  description: string;
  timestamp: string;
  severity: 'low' | 'medium' | 'high';
}

export function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalOperators: 0,
    totalVehicles: 0,
    activeBookings: 0,
    pendingDisputes: 0,
    monthlyRevenue: 0,
    complianceScore: 0,
    systemHealth: 0
  });

  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Simulate API calls - replace with actual API calls
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock data - replace with actual API responses
      setStats({
        totalUsers: 12847,
        totalOperators: 342,
        totalVehicles: 1256,
        activeBookings: 89,
        pendingDisputes: 7,
        monthlyRevenue: 145230,
        complianceScore: 94,
        systemHealth: 98
      });

      setRecentActivity([
        {
          id: '1',
          type: 'user_registration',
          description: 'New user registered: john.doe@example.com',
          timestamp: '2024-01-15T10:30:00Z',
          severity: 'low'
        },
        {
          id: '2',
          type: 'dispute_filed',
          description: 'Dispute filed for booking #BK-2024-001234',
          timestamp: '2024-01-15T09:45:00Z',
          severity: 'high'
        },
        {
          id: '3',
          type: 'compliance_alert',
          description: 'Operator license expiring in 30 days: SafeDrive Rentals',
          timestamp: '2024-01-15T08:15:00Z',
          severity: 'medium'
        },
        {
          id: '4',
          type: 'booking_created',
          description: 'High-value booking created: $2,450 for 14 days',
          timestamp: '2024-01-15T07:20:00Z',
          severity: 'low'
        }
      ]);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type: RecentActivity['type']) => {
    switch (type) {
      case 'user_registration':
        return <Users className="h-4 w-4" />;
      case 'booking_created':
        return <FileText className="h-4 w-4" />;
      case 'dispute_filed':
        return <AlertTriangle className="h-4 w-4" />;
      case 'compliance_alert':
        return <Shield className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const getSeverityColor = (severity: RecentActivity['severity']) => {
    switch (severity) {
      case 'high':
        return 'text-red-600 bg-red-50';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50';
      case 'low':
        return 'text-green-600 bg-green-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600 mt-2">
          Monitor platform performance and manage operations
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Users */}
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Users</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalUsers.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-full">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
            <span className="text-green-600">+12% from last month</span>
          </div>
        </Card>

        {/* Total Operators */}
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Operators</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalOperators.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-green-50 rounded-full">
              <Shield className="h-6 w-6 text-green-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
            <span className="text-green-600">+8% from last month</span>
          </div>
        </Card>

        {/* Total Vehicles */}
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Vehicles</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalVehicles.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-purple-50 rounded-full">
              <Car className="h-6 w-6 text-purple-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
            <span className="text-green-600">+15% from last month</span>
          </div>
        </Card>

        {/* Monthly Revenue */}
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Monthly Revenue</p>
              <p className="text-3xl font-bold text-gray-900">{formatCurrency(stats.monthlyRevenue)}</p>
            </div>
            <div className="p-3 bg-yellow-50 rounded-full">
              <DollarSign className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
            <span className="text-green-600">+23% from last month</span>
          </div>
        </Card>

        {/* Active Bookings */}
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Bookings</p>
              <p className="text-3xl font-bold text-gray-900">{stats.activeBookings}</p>
            </div>
            <div className="p-3 bg-indigo-50 rounded-full">
              <FileText className="h-6 w-6 text-indigo-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <Activity className="h-4 w-4 text-blue-500 mr-1" />
            <span className="text-blue-600">Real-time count</span>
          </div>
        </Card>

        {/* Pending Disputes */}
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending Disputes</p>
              <p className="text-3xl font-bold text-gray-900">{stats.pendingDisputes}</p>
            </div>
            <div className="p-3 bg-red-50 rounded-full">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-gray-600">Requires attention</span>
          </div>
        </Card>

        {/* Compliance Score */}
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Compliance Score</p>
              <p className="text-3xl font-bold text-gray-900">{stats.complianceScore}%</p>
            </div>
            <div className="p-3 bg-green-50 rounded-full">
              <Shield className="h-6 w-6 text-green-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-green-600">Excellent rating</span>
          </div>
        </Card>

        {/* System Health */}
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">System Health</p>
              <p className="text-3xl font-bold text-gray-900">{stats.systemHealth}%</p>
            </div>
            <div className="p-3 bg-green-50 rounded-full">
              <Activity className="h-6 w-6 text-green-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-green-600">All systems operational</span>
          </div>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Activity</h2>
        <div className="space-y-4">
          {recentActivity.map((activity) => (
            <div key={activity.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50">
              <div className={`p-2 rounded-full ${getSeverityColor(activity.severity)}`}>
                {getActivityIcon(activity.type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">{activity.description}</p>
                <p className="text-xs text-gray-500 mt-1">{formatTimestamp(activity.timestamp)}</p>
              </div>
              <div className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(activity.severity)}`}>
                {activity.severity}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}