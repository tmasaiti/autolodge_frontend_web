// TEMPORARILY DISABLED - CONVERT BACK TO .tsx AFTER FIXING BASE PLATFORM
import React from 'react';

export interface DisputeListProps {
  disputes: any[];
  loading?: boolean;
  onDisputeSelect: (dispute: any) => void;
  onFiltersChange: (filters: any) => void;
  userType?: string;
  showFilters?: boolean;
}

export const DisputeList: React.FC<DisputeListProps> = () => {
  return (
    <div className="p-8 text-center">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">
        Dispute List - Temporarily Disabled
      </h2>
      <p className="text-gray-600">
        This component is being rebuilt step by step. Please check back soon.
      </p>
    </div>
  );
};