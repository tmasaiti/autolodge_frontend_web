// TEMPORARILY DISABLED - CONVERT BACK TO .tsx AFTER FIXING BASE PLATFORM
import React from 'react';

export interface DisputeCreationFormProps {
  bookingId: number;
  onSubmit: (disputeData: any) => void;
  onCancel: () => void;
}

export const DisputeCreationForm: React.FC<DisputeCreationFormProps> = () => {
  return (
    <div className="p-8 text-center">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">
        Dispute Creation Form - Temporarily Disabled
      </h2>
      <p className="text-gray-600">
        This component is being rebuilt step by step. Please check back soon.
      </p>
    </div>
  );
};