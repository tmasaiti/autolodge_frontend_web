import React from 'react';
import { WizardData } from './WizardContainer';

export interface WizardStepProps {
  data: WizardData;
  allData: WizardData;
  onDataChange: (data: Partial<WizardData>) => void;
  onNext?: () => void;
  onPrevious?: () => void;
}

export interface WizardStepWrapperProps extends WizardStepProps {
  children: React.ReactNode;
  className?: string;
}

export const WizardStepWrapper: React.FC<WizardStepWrapperProps> = ({
  children,
  className = ''
}) => {
  return (
    <div className={`wizard-step ${className}`}>
      {children}
    </div>
  );
};

// Higher-order component to wrap wizard steps
export function withWizardStep<P extends object>(
  Component: React.ComponentType<P & WizardStepProps>
) {
  return React.forwardRef<any, P & Partial<WizardStepProps>>((props, ref) => {
    const {
      data = {},
      allData = {},
      onDataChange = () => {},
      onNext,
      onPrevious,
      ...componentProps
    } = props;

    return (
      <Component
        ref={ref}
        {...(componentProps as P)}
        data={data}
        allData={allData}
        onDataChange={onDataChange}
        onNext={onNext}
        onPrevious={onPrevious}
      />
    );
  });
}