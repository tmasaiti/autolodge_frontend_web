/**
 * Performance Dashboard Component
 * Provides detailed performance monitoring and analytics for administrators
 */

import React, { useState, useEffect } from 'react';
import {
  Activity,
  TrendingUp,
  TrendingDown,
  Clock,
  Zap,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  LineChart,
  PieChart,
  Download,
  RefreshCw
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { usePerformanceMonitoring } from '../../hooks/usePerformanceMonitoring';
import { performanceMonitor } from '../../utils/performance-monitoring';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';

interface PerformanceMetricCard {
  title: string;
  value: string | number;
  change?: number;
  status: 'good' | 'warning' | 'poor';
  description: string;
}

export const PerformanceDashboard: React.FC = () => {
  const { webVitals, metrics, getPerformanceSummary } = usePerformanceMonitoring();
  const [timeRange, setTimeRange] = useState<'1h' | '24h' | '7d' | '30d'>('24h');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [performanceCards, setPerformanceCards] = useState<PerformanceMetricCard[]>([]);

  useEffect(() => {
    updatePerformanceCards();
  }, [webVitals, metrics]);

  const updatePerformanceCards = () => {
    const summary = getPerformanceSummary();
    
    const cards: PerformanceMetricCard[] = [
      {
        title: 'Largest Contentful Paint',
        value: webVitals.LCP ? `${Math.round(webVitals.LCP)}ms` : 'N/A',
        status: getMetricStatus('LCP', webVitals.LCP),
        description: 'Time until the largest content element is rendered'
      },
      {
        title: 'First Input Delay',
        value: webVitals.FID ? `${Math.round(webVitals.FID)}ms` : 'N/A',
        status: getMetricStatus('FID', webVitals.FID),
        description: 'Time from first user interaction to browser response'
      },
      {
        title: 'Cumulative Layout Shift',
        value: webVitals.CLS ? webVitals.CLS.toFixed(3) : 'N/A',
        status: getMetricStatus('CLS', webVitals.CLS),
        description: 'Visual stability of the page during loading'
      },
      {
        title: 'Time to First Byte',
        value: webVitals.TTFB ? `${Math.round(webVitals.TTFB)}ms` : 'N/A',
        status: getMetricStatus('TTFB', webVitals.TTFB),
        description: 'Time from request start to first byte received'
      },
      {
        title: 'Long Tasks',
        value: summary.longTasks || 0,
        status: summary.longTasks > 5 ? 'poor' : summary.longTasks > 2 ? 'warning' : 'good',
        description: 'Tasks that block the main thread for >50ms'
      },
      {
        title: 'Slow Resources',
        value: summary.slowResources || 0,
        status: summary.slowResources > 3 ? 'poor' : summary.slowResources > 1 ? 'warning' : 'good',
        description: 'Resources that take >1s to load'
      }
    ];

    setPerformanceCards(cards);
  };

  const getMetricStatus = (metric: string, value?: number): 'good' | 'warning' | 'poor' => {
    if (!value) return 'good';
    
    const thresholds = {
      LCP: { good: 2500, poor: 4000 },
      FID: { good: 100, poor: 300 },
      CLS: { good: 0.1, poor: 0.25 },
      TTFB: { good: 600, poor: 1000 },
      INP: { good: 200, poor: 500 }
    };

    const threshold = thresholds[metric as keyof typeof thresholds];
    if (!threshold) return 'good';

    if (value <= threshold.good) return 'good';
    if (value <= threshold.poor) return 'warning';
    return 'poor';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'good': return CheckCircle;
      case 'warning': return AlertTriangle;
      case 'poor': return AlertTriangle;
      default: return Clock;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good': return 'text-green-600';
      case 'warning': return 'text-yellow-600';
      case 'poor': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Simulate refresh delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    updatePerformanceCards();
    setIsRefreshing(false);
  };

  const exportData = () => {
    const data = {
      timestamp: new Date().toISOString(),
      webVitals,
      metrics: metrics.slice(-100), // Last 100 metrics
      summary: getPerformanceSummary()
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `performance-data-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Performance Dashboard</h1>
          <p className="text-gray-600 mt-1">Monitor application performance and Core Web Vitals</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as any)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm"
          >
            <option value="1h">Last Hour</option>
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
          </select>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={cn('w-4 h-4 mr-2', isRefreshing && 'animate-spin')} />
            Refresh
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={exportData}
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Performance Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {performanceCards.map((card, index) => {
          const StatusIcon = getStatusIcon(card.status);
          
          return (
            <Card key={index} className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <StatusIcon className={cn('w-5 h-5', getStatusColor(card.status))} />
                  <h3 className="text-sm font-medium text-gray-900">{card.title}</h3>
                </div>
                
                {card.change !== undefined && (
                  <div className={cn(
                    'flex items-center space-x-1 text-xs',
                    card.change > 0 ? 'text-red-600' : 'text-green-600'
                  )}>
                    {card.change > 0 ? (
                      <TrendingUp className="w-3 h-3" />
                    ) : (
                      <TrendingDown className="w-3 h-3" />
                    )}
                    <span>{Math.abs(card.change)}%</span>
                  </div>
                )}
              </div>
              
              <div className="mb-2">
                <div className="text-2xl font-bold text-gray-900">{card.value}</div>
              </div>
              
              <p className="text-xs text-gray-600">{card.description}</p>
            </Card>
          );
        })}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance Trends Chart */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Performance Trends</h3>
            <LineChart className="w-5 h-5 text-gray-400" />
          </div>
          
          <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
            <div className="text-center text-gray-500">
              <BarChart3 className="w-8 h-8 mx-auto mb-2" />
              <p className="text-sm">Performance trend chart would be rendered here</p>
              <p className="text-xs text-gray-400">Integration with charting library needed</p>
            </div>
          </div>
        </Card>

        {/* Resource Performance */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Resource Performance</h3>
            <PieChart className="w-5 h-5 text-gray-400" />
          </div>
          
          <div className="space-y-3">
            {Object.entries(getPerformanceSummary().resourceCounts || {}).map(([type, count]) => (
              <div key={type} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full" />
                  <span className="text-sm text-gray-700 capitalize">{type}</span>
                </div>
                <span className="text-sm font-medium text-gray-900">{count}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Detailed Metrics Table */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Recent Metrics</h3>
          <Activity className="w-5 h-5 text-gray-400" />
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Metric
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Value
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Timestamp
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  URL
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {metrics.slice(-10).reverse().map((metric, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {metric.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {metric.name.includes('CLS') 
                      ? metric.value.toFixed(3)
                      : `${Math.round(metric.value)}ms`
                    }
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(metric.timestamp).toLocaleTimeString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 max-w-xs truncate">
                    {metric.url}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Performance Budget Status */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Performance Budget Status</h3>
          <Zap className="w-5 h-5 text-gray-400" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {getPerformanceSummary().budgetStatus.map((status: any, index: number) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-900">{status.metric}</span>
                <span className={cn(
                  'text-xs px-2 py-1 rounded-full',
                  status.status === 'good' && 'bg-green-100 text-green-800',
                  status.status === 'warning' && 'bg-yellow-100 text-yellow-800',
                  status.status === 'poor' && 'bg-red-100 text-red-800'
                )}>
                  {status.status}
                </span>
              </div>
              
              <div className="text-lg font-bold text-gray-900 mb-1">
                {status.metric === 'CLS' 
                  ? status.current.toFixed(3)
                  : `${Math.round(status.current)}ms`
                }
              </div>
              
              <div className="text-xs text-gray-500">
                Budget: {status.metric === 'CLS' 
                  ? status.budget.toFixed(1)
                  : `${status.budget}ms`
                }
              </div>
              
              {/* Progress bar */}
              <div className="mt-2 bg-gray-200 rounded-full h-2">
                <div
                  className={cn(
                    'h-2 rounded-full',
                    status.status === 'good' && 'bg-green-500',
                    status.status === 'warning' && 'bg-yellow-500',
                    status.status === 'poor' && 'bg-red-500'
                  )}
                  style={{
                    width: `${Math.min((status.current / status.budget) * 100, 100)}%`
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};