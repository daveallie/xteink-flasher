'use client';

import { useState } from 'react';
import { StepData } from '@/types/Step';

export default function useStepRunner() {
  const [stepData, setStepData] = useState<StepData[]>([]);

  const initializeSteps = (stepNames: string[]) => {
    setStepData(stepNames.map((step) => ({ name: step, status: 'pending' })));
  };

  const updateStepData = (step: string, data: Partial<StepData>) => {
    setStepData((oldStepData) =>
      oldStepData.map((oldData) => {
        if (oldData.name === step) {
          return { ...oldData, ...data };
        }
        return oldData;
      }),
    );
  };

  const runStep = async <T>(stepName: string, fn: () => Promise<T>) => {
    updateStepData(stepName, { status: 'running' });

    try {
      const result = await fn();
      updateStepData(stepName, { status: 'success' });
      return result;
    } catch (error) {
      let parsedError;
      if (error instanceof Error) {
        parsedError = error;
      } else if (typeof error === 'string') {
        parsedError = new Error(error);
      } else {
        parsedError = new Error(`${error}`);
      }
      updateStepData(stepName, { status: 'failed', error: parsedError });
      throw error;
    }
  };

  return {
    stepData,
    initializeSteps,
    updateStepData,
    runStep,
  };
}
