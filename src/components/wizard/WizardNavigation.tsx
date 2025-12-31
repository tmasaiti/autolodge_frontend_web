import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '../ui/Button';

export interface WizardNavigationProps {
  canGoPrevious: boolean;
  canGoNext: boolean;
  isLastStep: boolean;
  isValidating?: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onCancel?: () => void;
  onComplete: () => void;
  previousLabel?: string;
  nextLabel?: string;
  completeLabel?: string;
  cancelLabel?: string;
  showCancel?: boolean;
}

export const WizardNavigation: React.FC<WizardNavigationProps> = ({
  canGoPrevious,
  canGoNext,
  isLastStep,
  isValidating = false,
  onPrevious,
  onNext,
  onCancel,
  onComplete,
  previousLabel = 'Previous',
  nextLabel = 'Next',
  completeLabel = 'Complete',
  cancelLabel = 'Cancel',
  showCancel = true
}) => {
  return (
    <div className="flex items-center justify-between pt-8 border-t border-neutral-200">
      <div className="flex items-center space-x-4">
        {showCancel && onCancel && (
          <Button
            variant="ghost"
            onClick={onCancel}
            disabled={isValidating}
            className="px-6 py-3"
            aria-label="Cancel wizard"
          >
            {cancelLabel}
          </Button>
        )}
      </div>

      <div className="flex items-center space-x-4">
        {canGoPrevious && (
          <Button
            variant="outline"
            onClick={onPrevious}
            disabled={isValidating}
            className="flex items-center px-6 py-3"
            aria-label="Go to previous step"
          >
            <ChevronLeft className="h-4 w-4 mr-2" aria-hidden="true" />
            {previousLabel}
          </Button>
        )}

        {isLastStep ? (
          <Button
            variant="accent"
            onClick={onComplete}
            loading={isValidating}
            className="flex items-center px-8 py-3 text-lg font-semibold"
            aria-label="Complete wizard"
          >
            {completeLabel}
          </Button>
        ) : (
          <Button
            variant="primary"
            onClick={onNext}
            disabled={!canGoNext}
            loading={isValidating}
            className="flex items-center px-8 py-3 text-lg font-semibold"
            aria-label="Go to next step"
          >
            {nextLabel}
            <ChevronRight className="h-4 w-4 ml-2" aria-hidden="true" />
          </Button>
        )}
      </div>
    </div>
  );
};