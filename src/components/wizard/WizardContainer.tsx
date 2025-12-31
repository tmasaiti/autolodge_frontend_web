import React, { useState, useCallback, useEffect } from 'react';
import { WizardProgress, WizardStep } from './WizardProgress';
import { WizardNavigation } from './WizardNavigation';
import { cn } from '../../utils/cn';

export interface WizardData {
  [key: string]: any;
}

export interface WizardContainerProps {
  steps: WizardStep[];
  initialData?: WizardData;
  onComplete: (data: WizardData) => void;
  onCancel?: () => void;
  className?: string;
  persistKey?: string; // Key for localStorage persistence
  showProgress?: boolean;
  allowSkipSteps?: boolean;
}

export const WizardContainer: React.FC<WizardContainerProps> = ({
  steps,
  initialData = {},
  onComplete,
  onCancel,
  className,
  persistKey,
  showProgress = true,
  allowSkipSteps = false
}) => {
  const [currentStepId, setCurrentStepId] = useState<string>(() => {
    // Try to restore from localStorage if persistKey is provided
    if (persistKey) {
      const saved = localStorage.getItem(`wizard_${persistKey}`);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          return parsed.currentStepId || steps[0]?.id;
        } catch {
          // Ignore parsing errors
        }
      }
    }
    return steps[0]?.id;
  });

  const [wizardData, setWizardData] = useState<WizardData>(() => {
    // Try to restore from localStorage if persistKey is provided
    if (persistKey) {
      const saved = localStorage.getItem(`wizard_${persistKey}`);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          return { ...initialData, ...parsed.data };
        } catch {
          // Ignore parsing errors
        }
      }
    }
    return initialData;
  });

  const [completedSteps, setCompletedSteps] = useState<string[]>(() => {
    // Try to restore from localStorage if persistKey is provided
    if (persistKey) {
      const saved = localStorage.getItem(`wizard_${persistKey}`);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          return parsed.completedSteps || [];
        } catch {
          // Ignore parsing errors
        }
      }
    }
    return [];
  });

  const [isValidating, setIsValidating] = useState(false);

  // Persist wizard state to localStorage
  useEffect(() => {
    if (persistKey) {
      const state = {
        currentStepId,
        data: wizardData,
        completedSteps,
        timestamp: Date.now()
      };
      localStorage.setItem(`wizard_${persistKey}`, JSON.stringify(state));
    }
  }, [currentStepId, wizardData, completedSteps, persistKey]);

  // Filter steps based on conditions
  const visibleSteps = steps.filter(step => step.condition !== false);
  const currentStepIndex = visibleSteps.findIndex(step => step.id === currentStepId);
  const currentStep = visibleSteps[currentStepIndex];

  const updateWizardData = useCallback((stepId: string, data: Partial<WizardData>) => {
    setWizardData(prev => ({
      ...prev,
      [stepId]: {
        ...prev[stepId],
        ...data
      }
    }));
  }, []);

  const validateCurrentStep = useCallback(async (): Promise<boolean> => {
    if (!currentStep?.validation) return true;
    
    setIsValidating(true);
    try {
      const result = await currentStep.validation();
      return result;
    } catch (error) {
      console.error('Step validation error:', error);
      return false;
    } finally {
      setIsValidating(false);
    }
  }, [currentStep]);

  const goToNextStep = useCallback(async () => {
    const isValid = await validateCurrentStep();
    if (!isValid) return;

    // Mark current step as completed
    if (!completedSteps.includes(currentStepId)) {
      setCompletedSteps(prev => [...prev, currentStepId]);
    }

    const nextIndex = currentStepIndex + 1;
    if (nextIndex < visibleSteps.length) {
      setCurrentStepId(visibleSteps[nextIndex].id);
    } else {
      // Wizard complete
      handleComplete();
    }
  }, [currentStepId, currentStepIndex, visibleSteps, validateCurrentStep, completedSteps]);

  const goToPreviousStep = useCallback(() => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStepId(visibleSteps[prevIndex].id);
    }
  }, [currentStepIndex, visibleSteps]);

  const goToStep = useCallback(async (stepId: string) => {
    const targetIndex = visibleSteps.findIndex(step => step.id === stepId);
    const targetStep = visibleSteps[targetIndex];
    
    if (!targetStep) return;

    // If going forward, validate current step first
    if (targetIndex > currentStepIndex) {
      const isValid = await validateCurrentStep();
      if (!isValid) return;
      
      // Mark current step as completed
      if (!completedSteps.includes(currentStepId)) {
        setCompletedSteps(prev => [...prev, currentStepId]);
      }
    }

    // Check if step is accessible
    if (!allowSkipSteps && targetIndex > currentStepIndex + 1) {
      // Can't skip steps unless explicitly allowed
      return;
    }

    setCurrentStepId(stepId);
  }, [currentStepId, currentStepIndex, visibleSteps, validateCurrentStep, completedSteps, allowSkipSteps]);

  const handleComplete = useCallback(() => {
    // Clear persisted data on completion
    if (persistKey) {
      localStorage.removeItem(`wizard_${persistKey}`);
    }
    onComplete(wizardData);
  }, [wizardData, onComplete, persistKey]);

  const handleCancel = useCallback(() => {
    // Clear persisted data on cancel
    if (persistKey) {
      localStorage.removeItem(`wizard_${persistKey}`);
    }
    onCancel?.();
  }, [onCancel, persistKey]);

  if (!currentStep) {
    return <div>No steps available</div>;
  }

  const canGoNext = currentStepIndex < visibleSteps.length - 1;
  const canGoPrevious = currentStepIndex > 0;
  const isLastStep = currentStepIndex === visibleSteps.length - 1;

  return (
    <div className={cn('w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8', className)}>
      {showProgress && (
        <div className="mb-12">
          <WizardProgress
            steps={visibleSteps}
            currentStep={currentStepId}
            completedSteps={completedSteps}
          />
        </div>
      )}

      <div className="bg-white rounded-xl shadow-lg border border-neutral-200">
        <div className="p-8 sm:p-10">
          <div className="mb-10">
            <h1 className="text-3xl font-bold text-neutral-900 mb-3">
              {currentStep.title}
            </h1>
            {currentStep.description && (
              <p className="text-lg text-neutral-600 leading-relaxed">
                {currentStep.description}
              </p>
            )}
          </div>

          <div className="mb-12">
            {React.cloneElement(currentStep.component as React.ReactElement, {
              data: wizardData[currentStepId] || {},
              allData: wizardData,
              onDataChange: (data: Partial<WizardData>) => updateWizardData(currentStepId, data),
              onNext: goToNextStep,
              onPrevious: canGoPrevious ? goToPreviousStep : undefined
            })}
          </div>

          <WizardNavigation
            canGoPrevious={canGoPrevious}
            canGoNext={canGoNext}
            isLastStep={isLastStep}
            isValidating={isValidating}
            onPrevious={goToPreviousStep}
            onNext={goToNextStep}
            onCancel={handleCancel}
            onComplete={handleComplete}
          />
        </div>
      </div>
    </div>
  );
};