import React from 'react';
import { cn } from '../../utils/cn';

export interface TouchButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'accent' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg' | 'touch';
  fullWidth?: boolean;
  children: React.ReactNode;
}

const touchButtonVariants = {
  primary: 'bg-primary-600 text-white hover:bg-primary-700 active:bg-primary-800 focus:ring-primary-500',
  secondary: 'bg-secondary-600 text-white hover:bg-secondary-700 active:bg-secondary-800 focus:ring-secondary-500',
  accent: 'bg-accent-500 text-white hover:bg-accent-600 active:bg-accent-700 focus:ring-accent-500',
  outline: 'border-2 border-primary-300 text-primary-700 hover:bg-primary-50 active:bg-primary-100 focus:ring-primary-500',
  ghost: 'text-primary-700 hover:bg-primary-100 active:bg-primary-200 focus:ring-primary-500'
};

const touchButtonSizes = {
  sm: 'px-4 py-2 text-sm min-h-[36px]',
  md: 'px-6 py-3 text-base min-h-[44px]',
  lg: 'px-8 py-4 text-lg min-h-[52px]',
  touch: 'px-6 py-4 text-base min-h-[44px] min-w-[44px]' // iOS/Android minimum touch target
};

export const TouchButton: React.FC<TouchButtonProps> = ({
  variant = 'primary',
  size = 'touch',
  fullWidth = false,
  className,
  children,
  ...props
}) => {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200',
        'focus:outline-none focus:ring-2 focus:ring-offset-2',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        'touch-manipulation', // Prevents zoom on double-tap
        'select-none', // Prevents text selection
        touchButtonVariants[variant],
        touchButtonSizes[size],
        fullWidth && 'w-full',
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
};

export interface TouchInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
}

export const TouchInput: React.FC<TouchInputProps> = ({
  label,
  error,
  helperText,
  fullWidth = false,
  className,
  id,
  ...props
}) => {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className={cn('space-y-2', fullWidth && 'w-full')}>
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={cn(
          'block w-full px-4 py-3 text-base border border-gray-300 rounded-lg',
          'min-h-[44px]', // Touch-friendly height
          'focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
          'disabled:bg-gray-50 disabled:text-gray-500',
          'transition-colors duration-200',
          error && 'border-red-300 focus:ring-red-500 focus:border-red-500',
          className
        )}
        {...props}
      />
      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
      {helperText && !error && (
        <p className="text-sm text-gray-500">
          {helperText}
        </p>
      )}
    </div>
  );
};

export interface TouchSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
  options: Array<{ value: string; label: string; disabled?: boolean }>;
}

export const TouchSelect: React.FC<TouchSelectProps> = ({
  label,
  error,
  helperText,
  fullWidth = false,
  options,
  className,
  id,
  ...props
}) => {
  const selectId = id || `select-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className={cn('space-y-2', fullWidth && 'w-full')}>
      {label && (
        <label
          htmlFor={selectId}
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          {label}
        </label>
      )}
      <select
        id={selectId}
        className={cn(
          'block w-full px-4 py-3 text-base border border-gray-300 rounded-lg',
          'min-h-[44px]', // Touch-friendly height
          'focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
          'disabled:bg-gray-50 disabled:text-gray-500',
          'transition-colors duration-200',
          'appearance-none bg-white',
          error && 'border-red-300 focus:ring-red-500 focus:border-red-500',
          className
        )}
        {...props}
      >
        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
            disabled={option.disabled}
          >
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
      {helperText && !error && (
        <p className="text-sm text-gray-500">
          {helperText}
        </p>
      )}
    </div>
  );
};

export interface SwipeableCardProps extends React.HTMLAttributes<HTMLDivElement> {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  swipeThreshold?: number;
  children: React.ReactNode;
}

export const SwipeableCard: React.FC<SwipeableCardProps> = ({
  onSwipeLeft,
  onSwipeRight,
  swipeThreshold = 100,
  className,
  children,
  ...props
}) => {
  const [startX, setStartX] = React.useState<number | null>(null);
  const [currentX, setCurrentX] = React.useState<number | null>(null);
  const [isDragging, setIsDragging] = React.useState(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    setStartX(e.touches[0].clientX);
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!startX) return;
    setCurrentX(e.touches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!startX || !currentX) {
      setStartX(null);
      setCurrentX(null);
      setIsDragging(false);
      return;
    }

    const diffX = currentX - startX;

    if (Math.abs(diffX) > swipeThreshold) {
      if (diffX > 0 && onSwipeRight) {
        onSwipeRight();
      } else if (diffX < 0 && onSwipeLeft) {
        onSwipeLeft();
      }
    }

    setStartX(null);
    setCurrentX(null);
    setIsDragging(false);
  };

  const translateX = isDragging && startX && currentX ? currentX - startX : 0;

  return (
    <div
      className={cn(
        'touch-pan-y select-none transition-transform duration-200',
        isDragging && 'cursor-grabbing',
        className
      )}
      style={{
        transform: `translateX(${translateX}px)`,
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      {...props}
    >
      {children}
    </div>
  );
};

export interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  threshold?: number;
  children: React.ReactNode;
}

export const PullToRefresh: React.FC<PullToRefreshProps> = ({
  onRefresh,
  threshold = 80,
  children
}) => {
  const [startY, setStartY] = React.useState<number | null>(null);
  const [currentY, setCurrentY] = React.useState<number | null>(null);
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [isPulling, setIsPulling] = React.useState(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (window.scrollY === 0) {
      setStartY(e.touches[0].clientY);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!startY || window.scrollY > 0) return;
    
    const currentY = e.touches[0].clientY;
    const pullDistance = currentY - startY;
    
    if (pullDistance > 0) {
      setCurrentY(currentY);
      setIsPulling(pullDistance > threshold);
    }
  };

  const handleTouchEnd = async () => {
    if (!startY || !currentY) {
      setStartY(null);
      setCurrentY(null);
      setIsPulling(false);
      return;
    }

    const pullDistance = currentY - startY;

    if (pullDistance > threshold && !isRefreshing) {
      setIsRefreshing(true);
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
      }
    }

    setStartY(null);
    setCurrentY(null);
    setIsPulling(false);
  };

  const pullDistance = startY && currentY ? Math.max(0, currentY - startY) : 0;
  const pullProgress = Math.min(pullDistance / threshold, 1);

  return (
    <div
      className="relative overflow-hidden"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull indicator */}
      <div
        className={cn(
          'absolute top-0 left-0 right-0 flex items-center justify-center',
          'bg-primary-50 text-primary-600 transition-all duration-200',
          'transform -translate-y-full',
          (isPulling || isRefreshing) && 'translate-y-0'
        )}
        style={{
          height: `${Math.min(pullDistance, threshold)}px`,
        }}
      >
        <div className="flex items-center space-x-2">
          <div
            className={cn(
              'w-4 h-4 border-2 border-primary-600 rounded-full',
              isRefreshing && 'animate-spin border-t-transparent'
            )}
            style={{
              transform: `rotate(${pullProgress * 360}deg)`,
            }}
          />
          <span className="text-sm font-medium">
            {isRefreshing ? 'Refreshing...' : isPulling ? 'Release to refresh' : 'Pull to refresh'}
          </span>
        </div>
      </div>

      {/* Content */}
      <div
        className="transition-transform duration-200"
        style={{
          transform: `translateY(${Math.min(pullDistance, threshold)}px)`,
        }}
      >
        {children}
      </div>
    </div>
  );
};