import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface WizardStep {
  id: string;
  title: string;
  description?: string;
  component: React.ReactNode;
  condition?: boolean;
  validation?: () => boolean | Promise<boolean>;
}

export interface WizardProgressProps {
  steps: WizardStep[];
  currentStep: string;
  completedSteps: string[];
  className?: string;
}

export const WizardProgress: React.FC<WizardProgressProps> = ({
  steps,
  currentStep,
  completedSteps,
  className
}) => {
  const visibleSteps = steps.filter(step => step.condition !== false);
  const currentStepIndex = visibleSteps.findIndex(step => step.id === currentStep);

  return (
    <div className={cn('w-full', className)}>
      <nav aria-label="Wizard Progress" role="navigation">
        <ol className="flex items-center justify-center space-x-4 sm:space-x-8">
          {visibleSteps.map((step, index) => {
            const isCompleted = completedSteps.includes(step.id);
            const isCurrent = step.id === currentStep;
            const isUpcoming = index > currentStepIndex;

            return (
              <li key={step.id} className="relative flex flex-col items-center">
                {/* Connector line */}
                {index !== visibleSteps.length - 1 && (
                  <div 
                    className="absolute left-full top-4 w-4 sm:w-8 h-0.5 -translate-y-1/2"
                    aria-hidden="true"
                  >
                    <div className={cn(
                      'h-full w-full',
                      isCompleted ? 'bg-primary-600' : 'bg-neutral-200'
                    )} />
                  </div>
                )}

                {/* Step indicator */}
                <div className="relative flex items-center justify-center mb-3">
                  <div
                    className={cn(
                      'flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors',
                      isCompleted && 'border-primary-600 bg-primary-600',
                      isCurrent && 'border-primary-600 bg-white ring-4 ring-primary-100',
                      isUpcoming && 'border-neutral-300 bg-white'
                    )}
                    aria-current={isCurrent ? 'step' : undefined}
                  >
                    {isCompleted ? (
                      <Check className="h-5 w-5 text-white" aria-hidden="true" />
                    ) : (
                      <span
                        className={cn(
                          'h-3 w-3 rounded-full',
                          isCurrent && 'bg-primary-600',
                          isUpcoming && 'bg-transparent'
                        )}
                        aria-hidden="true"
                      />
                    )}
                  </div>
                </div>

                {/* Step label */}
                <div className="text-center max-w-24">
                  <div
                    className={cn(
                      'text-sm font-medium leading-tight',
                      isCompleted && 'text-primary-600',
                      isCurrent && 'text-primary-600',
                      isUpcoming && 'text-neutral-500'
                    )}
                  >
                    {step.title}
                  </div>
                  {step.description && (
                    <div className="text-xs text-neutral-500 mt-1 leading-tight">
                      {step.description}
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      </nav>
    </div>
  );
};