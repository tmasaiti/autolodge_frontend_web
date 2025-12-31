import React, { useState } from 'react';
import { X, Download, Smartphone, Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { cn } from '../../utils/cn';
import { usePWA } from '../../hooks/usePWA';
import { TouchButton } from './TouchFriendly';

export interface InstallPromptProps {
  className?: string;
}

export const InstallPrompt: React.FC<InstallPromptProps> = ({ className }) => {
  const { isInstallable, install, dismissInstallPrompt } = usePWA();
  const [isInstalling, setIsInstalling] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  if (!isInstallable || isDismissed) {
    return null;
  }

  const handleInstall = async () => {
    setIsInstalling(true);
    try {
      await install();
    } catch (error) {
      console.error('Installation failed:', error);
    } finally {
      setIsInstalling(false);
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    dismissInstallPrompt();
  };

  return (
    <div
      className={cn(
        'fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-sm',
        'bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-50',
        'animate-slide-up',
        className
      )}
    >
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
            <Smartphone className="w-5 h-5 text-primary-600" />
          </div>
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-gray-900 mb-1">
            Install AutoLodge
          </h3>
          <p className="text-sm text-gray-600 mb-3">
            Get the full app experience with offline access and push notifications.
          </p>
          
          <div className="flex space-x-2">
            <TouchButton
              size="sm"
              variant="primary"
              onClick={handleInstall}
              disabled={isInstalling}
              className="flex-1"
            >
              {isInstalling ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Installing...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Install
                </>
              )}
            </TouchButton>
            
            <TouchButton
              size="sm"
              variant="ghost"
              onClick={handleDismiss}
              className="px-3"
            >
              <X className="w-4 h-4" />
            </TouchButton>
          </div>
        </div>
      </div>
    </div>
  );
};

export interface UpdatePromptProps {
  className?: string;
}

export const UpdatePrompt: React.FC<UpdatePromptProps> = ({ className }) => {
  const { isUpdateAvailable, updateApp } = usePWA();
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  if (!isUpdateAvailable || isDismissed) {
    return null;
  }

  const handleUpdate = async () => {
    setIsUpdating(true);
    try {
      await updateApp();
    } catch (error) {
      console.error('Update failed:', error);
      setIsUpdating(false);
    }
  };

  return (
    <div
      className={cn(
        'fixed top-4 left-4 right-4 md:left-auto md:right-4 md:max-w-sm',
        'bg-accent-50 border border-accent-200 rounded-lg shadow-lg p-4 z-50',
        'animate-slide-down',
        className
      )}
    >
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          <div className="w-10 h-10 bg-accent-100 rounded-lg flex items-center justify-center">
            <RefreshCw className="w-5 h-5 text-accent-600" />
          </div>
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-gray-900 mb-1">
            Update Available
          </h3>
          <p className="text-sm text-gray-600 mb-3">
            A new version of AutoLodge is ready to install with bug fixes and improvements.
          </p>
          
          <div className="flex space-x-2">
            <TouchButton
              size="sm"
              variant="accent"
              onClick={handleUpdate}
              disabled={isUpdating}
              className="flex-1"
            >
              {isUpdating ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update Now'
              )}
            </TouchButton>
            
            <TouchButton
              size="sm"
              variant="ghost"
              onClick={() => setIsDismissed(true)}
              className="px-3"
            >
              Later
            </TouchButton>
          </div>
        </div>
      </div>
    </div>
  );
};

export interface OfflineIndicatorProps {
  className?: string;
}

export const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({ className }) => {
  const { isOnline } = usePWA();
  const [wasOffline, setWasOffline] = useState(false);

  React.useEffect(() => {
    if (!isOnline) {
      setWasOffline(true);
    }
  }, [isOnline]);

  if (isOnline && !wasOffline) {
    return null;
  }

  return (
    <div
      className={cn(
        'fixed top-16 left-4 right-4 md:left-auto md:right-4 md:max-w-sm',
        'rounded-lg shadow-lg p-3 z-40 transition-all duration-300',
        isOnline 
          ? 'bg-green-50 border border-green-200 animate-slide-down' 
          : 'bg-orange-50 border border-orange-200 animate-slide-down',
        className
      )}
    >
      <div className="flex items-center space-x-3">
        <div className="flex-shrink-0">
          {isOnline ? (
            <Wifi className="w-5 h-5 text-green-600" />
          ) : (
            <WifiOff className="w-5 h-5 text-orange-600" />
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <p className={cn(
            'text-sm font-medium',
            isOnline ? 'text-green-800' : 'text-orange-800'
          )}>
            {isOnline ? 'Back Online' : 'You\'re Offline'}
          </p>
          <p className={cn(
            'text-xs',
            isOnline ? 'text-green-600' : 'text-orange-600'
          )}>
            {isOnline 
              ? 'All features are now available' 
              : 'Some features may be limited'
            }
          </p>
        </div>
      </div>
    </div>
  );
};

export interface PWAStatusProps {
  className?: string;
}

export const PWAStatus: React.FC<PWAStatusProps> = ({ className }) => {
  return (
    <div className={className}>
      <InstallPrompt />
      <UpdatePrompt />
      <OfflineIndicator />
    </div>
  );
};