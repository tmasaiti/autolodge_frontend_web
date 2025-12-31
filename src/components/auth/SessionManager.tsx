/**
 * Session Manager Component
 * Displays and manages active user sessions with device tracking
 */

import React, { useState, useEffect } from 'react';
import { authService, SessionInfo } from '../../services/authService';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Modal } from '../ui/Modal';
import { 
  Monitor, 
  Smartphone, 
  Tablet, 
  Globe, 
  MapPin, 
  Clock, 
  Shield, 
  AlertTriangle,
  X,
  RefreshCw
} from 'lucide-react';

interface SessionManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SessionManager({ isOpen, onClose }: SessionManagerProps) {
  const [sessions, setSessions] = useState<SessionInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [terminatingSession, setTerminatingSession] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadSessions();
    }
  }, [isOpen]);

  const loadSessions = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const sessionsData = await authService.getSessions();
      setSessions(sessionsData);
    } catch (error: any) {
      setError(error.message || 'Failed to load sessions');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTerminateSession = async (sessionId: string) => {
    try {
      setTerminatingSession(sessionId);
      await authService.terminateSession(sessionId);
      
      // Remove from local state
      setSessions(prev => prev.filter(session => session.session_id !== sessionId));
    } catch (error: any) {
      setError(error.message || 'Failed to terminate session');
    } finally {
      setTerminatingSession(null);
    }
  };

  const handleTerminateAllOthers = async () => {
    try {
      setIsLoading(true);
      await authService.terminateAllOtherSessions();
      
      // Keep only current session
      setSessions(prev => prev.filter(session => session.is_current));
    } catch (error: any) {
      setError(error.message || 'Failed to terminate sessions');
    } finally {
      setIsLoading(false);
    }
  };

  const getDeviceIcon = (deviceType: string) => {
    switch (deviceType.toLowerCase()) {
      case 'mobile':
        return <Smartphone className="w-5 h-5" />;
      case 'tablet':
        return <Tablet className="w-5 h-5" />;
      case 'desktop':
      default:
        return <Monitor className="w-5 h-5" />;
    }
  };

  const formatLastActivity = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    return `${diffDays} days ago`;
  };

  const getBrowserName = (userAgent: string) => {
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    return 'Unknown Browser';
  };

  const getOSName = (userAgent: string) => {
    if (userAgent.includes('Windows')) return 'Windows';
    if (userAgent.includes('Mac')) return 'macOS';
    if (userAgent.includes('Linux')) return 'Linux';
    if (userAgent.includes('Android')) return 'Android';
    if (userAgent.includes('iOS')) return 'iOS';
    return 'Unknown OS';
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <Modal.Header>
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center space-x-2">
            <Shield className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-semibold">Active Sessions</h2>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={loadSessions}
            disabled={isLoading}
            className="flex items-center space-x-1"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </Button>
        </div>
      </Modal.Header>
      
      <Modal.Body>
        <div className="space-y-6">
          {/* Session Overview */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-start space-x-2">
              <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium">Session Security</p>
                <p>
                  Monitor and manage all devices signed into your account. 
                  If you see any suspicious activity, terminate those sessions immediately.
                </p>
              </div>
            </div>
          </div>

          {error && (
            <div className="flex items-center space-x-2 text-red-600 text-sm bg-red-50 p-3 rounded-lg">
              <AlertTriangle className="w-4 h-4" />
              <span>{error}</span>
            </div>
          )}

          {/* Bulk Actions */}
          {sessions.length > 1 && (
            <div className="flex justify-between items-center">
              <p className="text-sm text-gray-600">
                {sessions.length} active sessions
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={handleTerminateAllOthers}
                disabled={isLoading}
                className="text-red-600 border-red-200 hover:bg-red-50"
              >
                Terminate All Others
              </Button>
            </div>
          )}

          {/* Sessions List */}
          <div className="space-y-4">
            {isLoading && sessions.length === 0 ? (
              <div className="text-center py-8">
                <RefreshCw className="w-8 h-8 text-gray-400 animate-spin mx-auto mb-2" />
                <p className="text-gray-500">Loading sessions...</p>
              </div>
            ) : sessions.length === 0 ? (
              <div className="text-center py-8">
                <Shield className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">No active sessions found</p>
              </div>
            ) : (
              sessions.map((session) => (
                <Card key={session.session_id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <div className="text-gray-600">
                        {getDeviceIcon(session.device_info.device_type)}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="font-medium text-gray-900">
                            {getBrowserName(session.device_info.browser)} on {getOSName(session.device_info.os)}
                          </h3>
                          {session.is_current && (
                            <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                              Current Session
                            </span>
                          )}
                        </div>
                        
                        <div className="space-y-1 text-sm text-gray-600">
                          <div className="flex items-center space-x-1">
                            <Globe className="w-3 h-3" />
                            <span>IP: {session.device_info.ip_address}</span>
                          </div>
                          
                          {session.device_info.location && (
                            <div className="flex items-center space-x-1">
                              <MapPin className="w-3 h-3" />
                              <span>{session.device_info.location}</span>
                            </div>
                          )}
                          
                          <div className="flex items-center space-x-1">
                            <Clock className="w-3 h-3" />
                            <span>Last active: {formatLastActivity(session.last_activity)}</span>
                          </div>
                          
                          <div className="text-xs text-gray-500">
                            Created: {new Date(session.created_at).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {!session.is_current && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleTerminateSession(session.session_id)}
                        disabled={terminatingSession === session.session_id}
                        className="text-red-600 border-red-200 hover:bg-red-50 flex items-center space-x-1"
                      >
                        {terminatingSession === session.session_id ? (
                          <RefreshCw className="w-3 h-3 animate-spin" />
                        ) : (
                          <X className="w-3 h-3" />
                        )}
                        <span>Terminate</span>
                      </Button>
                    )}
                  </div>
                </Card>
              ))
            )}
          </div>

          {/* Security Tips */}
          <div className="bg-yellow-50 p-4 rounded-lg">
            <div className="flex items-start space-x-2">
              <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div className="text-sm text-yellow-800">
                <p className="font-medium">Security Tips:</p>
                <ul className="mt-1 space-y-1 list-disc list-inside">
                  <li>Regularly review your active sessions</li>
                  <li>Terminate sessions from unfamiliar devices or locations</li>
                  <li>Always log out from public or shared computers</li>
                  <li>Enable two-factor authentication for added security</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </Modal.Body>
    </Modal>
  );
}