// TEMPORARILY DISABLED - CONVERT BACK TO .tsx AFTER FIXING BASE PLATFORM
import React from 'react';

export interface AdminDisputeManagementProps {
  disputes: any[];
  statistics: any;
  onDisputeSelect: (dispute: any) => void;
  onFiltersChange: (filters: any) => void;
  onResolveDispute: (disputeId: number, resolution: any) => void;
  onEscalateDispute: (disputeId: number, reason: string) => void;
  onExportReport: () => void;
  loading?: boolean;
}

export const AdminDisputeManagement: React.FC<AdminDisputeManagementProps> = () => {
  return (
    <div className="p-8 text-center">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">
        Admin Dispute Management - Temporarily Disabled
      </h2>
      <p className="text-gray-600">
        This component is being rebuilt step by step. Please check back soon.
      </p>
    </div>
  );
};