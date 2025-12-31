import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Zap, 
  Clock, 
  Wifi, 
  WifiOff, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { usePerformanceMonitoring, usePerformanceAlerts } from '../../hooks/usePerformanceMonitoring';
import { performanceMonitor } from '../../utils/performance-monitoring';
import { useOfflineSync } from '../../utils/offlineSync';

export interface PerformanceMonitorProps {
  showDetails?: boolean;
  className?: string;
}

export const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({
  showDetails = false,
  className
}) => {
  const [showMonitor, setShowMonitor] = useState(false);
  const { webVitals, getPerformanceSummary } = usePerformanceMonitoring();
  const { alerts, dismissAlert } = usePerformanceAlerts();
  const { syncStatus } = useOfflineSync();

  useEffect(() => {
    // Only show in development or when explicitly requested
    const isDev = process.env.NODE_ENV === 'development';
    const showPerf = localStorage.getItem('show-performance-monitor') === 'true';
    setShowMonitor(isDev || showPerf || showDetails);
  }, [showDetails]);

  if (!showMonitor) {
    return null;
  }

  const summary = getPerformanceSummary();

  const getScoreColor = (status: string) => {
    switch (status) {
      case 'good': return 'text-green-600';
      case 'warning': return 'text-yellow-600';
      case 'poor': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getScoreIcon = (status: string) => {
    switch (status) {
      case 'good': return CheckCircle;
      case 'warning': return AlertTriangle;
      case 'poor': return XCircle;
      default: return Clock;
    }
  };

  return (
    <>
      {/* Performance Alerts */}
      {alerts.map((alert, index) => (
        <div
          key={index}
          className={cn(
            'fixed top-20 left-4 right-4 md:left-auto md:right-4 md:max-w-md',
            'bg-orange-50 border border-orange-200 rounded-lg p-3 z-40',
            'animate-slide-down',
            alert.severity === 'error' && 'bg-red-50 border-red-200'
          )}
        >
          <div className="flex items-start space-x-3">
            <AlertTriangle className={cn(
              'w-5 h-5 flex-shrink-0 mt-0.5',
              alert.severity === 'error' ? 'text-red-600' : 'text-orange-600'
            )} />
            <div className="flex-1 min-w-0">
              <p className={cn(
                'text-sm font-medium',
                alert.severity === 'error' ? 'text-red-800' : 'text-orange-800'
              )}>
                Performance {alert.severity === 'error' ? 'Error' : 'Warning'}
              </p>
              <p className={cn(
                'text-sm mt-1',
                alert.severity === 'error' ? 'text-red-700' : 'text-orange-700'
              )}>
                {alert.message}
              </p>
              <button
                onClick={() => dismissAlert(index)}
                className={cn(
                  'text-xs mt-2 hover:underline',
                  alert.severity === 'error' ? 'text-red-600 hover:text-red-800' : 'text-orange-600 hover:text-orange-800'
                )}
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      ))}

      {/* Main Performance Monitor */}
      <div
        className={cn(
          'fixed bottom-4 right-4 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-50',
          'max-w-sm w-full md:w-auto',
          className
        )}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Activity className="w-5 h-5 text-primary-600" />
            <h3 className="text-sm font-medium text-gray-900">Performance</h3>
          </div>
          
          <div className="flex items-center space-x-2">
            {syncStatus.isOnline ? (
              <Wifi className="w-4 h-4 text-green-600" />
            ) : (
              <WifiOff className="w-4 h-4 text-red-600" />
            )}
            
            {syncStatus.pending > 0 && (
              <div className="flex items-center space-x-1">
                <Clock className="w-4 h-4 text-orange-600" />
                <span className="text-xs text-orange-600">{syncStatus.pending}</span>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-2">
          {/* Core Web Vitals */}
          {summary.budgetStatus.map((status: any) => {
            const Icon = getScoreIcon(status.status);
            const metricNames: { [key: string]: string } = {
              LCP: 'Largest Contentful Paint',
              FID: 'First Input Delay',
              CLS: 'Cumulative Layout Shift',
              FCP: 'First Contentful Paint',
              TTFB: 'Time to First Byte',
              INP: 'Interaction to Next Paint'
            };

            return (
              <div key={status.metric} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Icon className={cn('w-4 h-4', getScoreColor(status.status))} />
                  <span className="text-xs text-gray-700">
                    {metricNames[status.metric] || status.metric}
                  </span>
                </div>
                <div className="text-xs">
                  <span className={getScoreColor(status.status)}>
                    {status.metric === 'CLS' 
                      ? status.current.toFixed(3)
                      : `${Math.round(status.current)}ms`
                    }
                  </span>
                  <span className="text-gray-400 ml-1">
                    / {status.metric === 'CLS' 
                      ? status.budget.toFixed(1)
                      : `${status.budget}ms`
                    }
                  </span>
                </div>
              </div>
            );
          })}

          {/* Memory Usage */}
          <MemoryUsage />

          {/* Resource Performance */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-700">Long Tasks</span>
            <div className="flex items-center space-x-1">
              {summary.longTasks > 5 ? (
                <TrendingUp className="w-3 h-3 text-red-600" />
              ) : (
                <TrendingDown className="w-3 h-3 text-green-600" />
              )}
              <span className={cn(
                'text-xs',
                summary.longTasks > 5 ? 'text-red-600' : 'text-green-600'
              )}>
                {summary.longTasks}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-700">Slow Resources</span>
            <div className="flex items-center space-x-1">
              {summary.slowResources > 3 ? (
                <TrendingUp className="w-3 h-3 text-red-600" />
              ) : (
                <TrendingDown className="w-3 h-3 text-green-600" />
              )}
              <span className={cn(
                'text-xs',
                summary.slowResources > 3 ? 'text-red-600' : 'text-green-600'
              )}>
                {summary.slowResources}
              </span>
            </div>
          </div>

          {/* Sync Status */}
          <div className="pt-2 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-700">Offline Sync</span>
              <div className="flex items-center space-x-1">
                {syncStatus.syncInProgress && (
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                )}
                <span className="text-xs text-gray-500">
                  {syncStatus.pending > 0 
                    ? `${syncStatus.pending} pending`
                    : 'Up to date'
                  }
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

const MemoryUsage: React.FC = () => {
  const [memoryInfo, setMemoryInfo] = useState<any>(null);

  useEffect(() => {
    const updateMemory = () => {
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        setMemoryInfo(memory);
      }
    };

    updateMemory();
    const interval = setInterval(updateMemory, 5000);
    return () => clearInterval(interval);
  }, []);

  if (!memoryInfo) {
    return null;
  }

  const usedMB = Math.round(memoryInfo.usedJSHeapSize / 1024 / 1024);
  const totalMB = Math.round(memoryInfo.totalJSHeapSize / 1024 / 1024);
  const limitMB = Math.round(memoryInfo.jsHeapSizeLimit / 1024 / 1024);

  const usagePercent = (usedMB / limitMB) * 100;
  const isHigh = usagePercent > 80;

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-2">
        <Zap className={cn('w-4 h-4', isHigh ? 'text-red-600' : 'text-green-600')} />
        <span className="text-xs text-gray-700">Memory</span>
      </div>
      <div className="text-xs">
        <span className={isHigh ? 'text-red-600' : 'text-gray-600'}>
          {usedMB}MB
        </span>
        <span className="text-gray-400 ml-1">/ {limitMB}MB</span>
      </div>
    </div>
  );
};

export interface PerformanceAlertProps {
  className?: string;
}

export const PerformanceAlert: React.FC<PerformanceAlertProps> = ({ className }) => {
  const { alerts, dismissAlert } = usePerformanceAlerts();

  if (alerts.length === 0) {
    return null;
  }

  return (
    <>
      {alerts.map((alert, index) => (
        <div
          key={index}
          className={cn(
            'fixed top-20 left-4 right-4 md:left-auto md:right-4 md:max-w-md',
            'bg-orange-50 border border-orange-200 rounded-lg p-3 z-40',
            'animate-slide-down',
            alert.severity === 'error' && 'bg-red-50 border-red-200',
            className
          )}
        >
          <div className="flex items-start space-x-3">
            <AlertTriangle className={cn(
              'w-5 h-5 flex-shrink-0 mt-0.5',
              alert.severity === 'error' ? 'text-red-600' : 'text-orange-600'
            )} />
            <div className="flex-1 min-w-0">
              <p className={cn(
                'text-sm font-medium',
                alert.severity === 'error' ? 'text-red-800' : 'text-orange-800'
              )}>
                Performance {alert.severity === 'error' ? 'Error' : 'Warning'}
              </p>
              <p className={cn(
                'text-sm mt-1',
                alert.severity === 'error' ? 'text-red-700' : 'text-orange-700'
              )}>
                {alert.message}
              </p>
              <button
                onClick={() => dismissAlert(index)}
                className={cn(
                  'text-xs mt-2 hover:underline',
                  alert.severity === 'error' ? 'text-red-600 hover:text-red-800' : 'text-orange-600 hover:text-orange-800'
                )}
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      ))}
    </>
  );
};

export interface ResourceAnalyzerProps {
  className?: string;
}

export const ResourceAnalyzer: React.FC<ResourceAnalyzerProps> = ({ className }) => {
  const [resources, setResources] = useState<any[]>([]);
  const [showAnalyzer, setShowAnalyzer] = useState(false);
  const { metrics } = usePerformanceMonitoring();

  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      // Get resource metrics from performance monitor
      const resourceMetrics = metrics
        .filter(m => m.name.startsWith('RESOURCE_'))
        .sort((a, b) => b.value - a.value)
        .slice(0, 10);
      
      setResources(resourceMetrics);
    }
  }, [metrics]);

  if (!showAnalyzer || resources.length === 0) {
    return (
      <button
        onClick={() => setShowAnalyzer(true)}
        className="fixed bottom-20 right-4 bg-gray-800 text-white p-2 rounded-full shadow-lg z-40"
      >
        <Activity className="w-4 h-4" />
      </button>
    );
  }

  return (
    <div
      className={cn(
        'fixed bottom-20 right-4 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-50',
        'max-w-md w-full',
        className
      )}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-900">Resource Analysis</h3>
        <button
          onClick={() => setShowAnalyzer(false)}
          className="text-gray-400 hover:text-gray-600"
        >
          ×
        </button>
      </div>

      <div className="space-y-2 max-h-64 overflow-y-auto">
        {resources.map((resource, index) => (
          <div key={index} className="flex items-center justify-between text-xs">
            <div className="flex-1 min-w-0">
              <div className="truncate text-gray-700">
                {resource.name.replace('RESOURCE_', '')}
              </div>
              <div className="text-gray-500">{new Date(resource.timestamp).toLocaleTimeString()}</div>
            </div>
            <div className="text-right ml-2">
              <div className="text-gray-900">{Math.round(resource.value)}ms</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};