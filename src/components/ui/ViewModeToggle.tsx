import React from 'react';
import { Grid3X3, List, Map } from 'lucide-react';
import { cn } from '../../utils/cn';

export type ViewMode = 'grid' | 'list' | 'map';

export interface ViewModeToggleProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  showMapView?: boolean;
  className?: string;
}

export const ViewModeToggle: React.FC<ViewModeToggleProps> = ({
  viewMode,
  onViewModeChange,
  showMapView = true,
  className
}) => {
  const modes: Array<{ mode: ViewMode; icon: React.ReactNode; label: string }> = [
    { mode: 'grid', icon: <Grid3X3 className="h-4 w-4" />, label: 'Grid' },
    { mode: 'list', icon: <List className="h-4 w-4" />, label: 'List' },
  ];

  if (showMapView) {
    modes.push({ mode: 'map', icon: <Map className="h-4 w-4" />, label: 'Map' });
  }

  return (
    <div className={cn('flex rounded-lg border border-gray-200 bg-white', className)}>
      {modes.map(({ mode, icon, label }) => (
        <button
          key={mode}
          onClick={() => onViewModeChange(mode)}
          className={cn(
            'flex items-center justify-center px-3 py-2 text-sm font-medium transition-colors',
            'first:rounded-l-lg last:rounded-r-lg',
            viewMode === mode
              ? 'bg-blue-50 text-blue-700 border-blue-200'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          )}
          title={label}
        >
          {icon}
          <span className="ml-1 hidden sm:inline">{label}</span>
        </button>
      ))}
    </div>
  );
};