import { useState, useCallback, useEffect } from 'react';
import { WizardStep, WizardData } from '../components/wizard';

export interface UseWizardOptions {
  steps: WizardStep[];
  initialData?: WizardData;
  persistKey?: string;
  onComplete?: (data: WizardData) => void;
  onStepChange?: (stepId: string, data: WizardData) => void;
}

export interface UseWizardReturn {
  currentStepId: string;
  currentStepIndex: number;
  currentStep: WizardStep | undefined;
  wizardData: WizardData;
  completedSteps: string[];
  visibleSteps: WizardStep[];
  canGoNext: boolean;
  canGoPrevious: boolean;
  isLastStep: boolean;
  isValidating: boolean;
  updateStepData: (stepId: string, data: Partial<WizardData>) => void;
  goToNextStep: () => Promise<void>;
  goToPreviousStep: () => void;
  goToStep: (stepId: string) => Promise<void>;
  resetWizard: () => void;
  completeWizard: () => void;
}

export function useWizard({
  steps,
  initialData = {},
  persistKey,
  onComplete,
  onStepChange
}: UseWizardOptions): UseWizardReturn {
  const [currentStepId, setCurrentStepId] = useState<string>(() => {
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

  // Filter steps based on conditions
  const visibleSteps = steps.filter(step => step.condition !== false);
  const currentStepIndex = visibleSteps.findIndex(step => step.id === currentStepId);
  const currentStep = visibleSteps[currentStepIndex];

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

  // Call onStepChange when step changes
  useEffect(() => {
    onStepChange?.(currentStepId, wizardData);
  }, [currentStepId, wizardData, onStepChange]);

  const updateStepData = useCallback((stepId: string, data: Partial<WizardData>) => {
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
      completeWizard();
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

    setCurrentStepId(stepId);
  }, [currentStepId, currentStepIndex, visibleSteps, validateCurrentStep, completedSteps]);

  const resetWizard = useCallback(() => {
    setCurrentStepId(steps[0]?.id);
    setWizardData(initialData);
    setCompletedSteps([]);
    
    if (persistKey) {
      localStorage.removeItem(`wizard_${persistKey}`);
    }
  }, [steps, initialData, persistKey]);

  const completeWizard = useCallback(() => {
    if (persistKey) {
      localStorage.removeItem(`wizard_${persistKey}`);
    }
    onComplete?.(wizardData);
  }, [wizardData, onComplete, persistKey]);

  const canGoNext = currentStepIndex < visibleSteps.length - 1;
  const canGoPrevious = currentStepIndex > 0;
  const isLastStep = currentStepIndex === visibleSteps.length - 1;

  return {
    currentStepId,
    currentStepIndex,
    currentStep,
    wizardData,
    completedSteps,
    visibleSteps,
    canGoNext,
    canGoPrevious,
    isLastStep,
    isValidating,
    updateStepData,
    goToNextStep,
    goToPreviousStep,
    goToStep,
    resetWizard,
    completeWizard
  };
}