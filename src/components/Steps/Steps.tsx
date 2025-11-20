import React from 'react';
import {
  Alert,
  Steps as ChakraSteps,
  Progress,
  ProgressCircle,
  Flex,
} from '@chakra-ui/react';
import { StepData } from '@/types/Step';

function RunningStepIndicator({ index }: { index: number }) {
  return (
    <div style={{ position: 'relative', height: 24, width: 24, flexShrink: 0 }}>
      <div
        style={{
          position: 'absolute',
          background: 'var(--chakra-colors-color-palette-muted)',
          color: 'var(--chakra-colors-color-palette-fg)',
          fontWeight: 'var(--chakra-font-weights-medium)',
          width: '100%',
          height: '100%',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {index + 1}
      </div>
      <ProgressCircle.Root value={null} size="xs">
        <ProgressCircle.Circle css={{ '--thickness': '2px' }}>
          <ProgressCircle.Track />
          <ProgressCircle.Range />
        </ProgressCircle.Circle>
      </ProgressCircle.Root>
    </div>
  );
}

function FailedStepIndicator({ index }: { index: number }) {
  return (
    <div
      style={{
        flexShrink: 0,
        width: 24,
        height: 24,
        background: 'var(--chakra-colors-bg-error)',
        color: 'var(--chakra-colors-fg-error)',
        fontWeight: 'var(--chakra-font-weights-medium)',
        borderWidth: 2,
        borderColor: 'var(--chakra-colors-border-error)',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {index + 1}
    </div>
  );
}

function StepIndicator({
  index,
  status,
}: {
  status: StepData['status'];
  index: number;
}) {
  if (status === 'running') {
    return <RunningStepIndicator index={index} />;
  }

  if (status === 'failed') {
    return <FailedStepIndicator index={index} />;
  }

  return <ChakraSteps.Indicator />;
}

export default function Steps({ steps }: { steps: StepData[] }) {
  let step = steps.findIndex((s) => s.status !== 'success');
  if (step === -1) {
    step = steps.length;
  }

  return (
    <ChakraSteps.Root
      orientation="vertical"
      defaultStep={1}
      count={steps.length}
      size="xs"
      step={step}
    >
      <ChakraSteps.List flex={1}>
        {steps.map((s, index) => (
          <ChakraSteps.Item
            // eslint-disable-next-line react/no-array-index-key
            key={index}
            index={index}
            title={s.name}
            width="100%"
          >
            <StepIndicator status={s.status} index={index} />

            <Flex
              direction="column"
              flexGrow={1}
              minHeight={index < steps.length - 1 ? '60px' : undefined}
            >
              <ChakraSteps.Title>{s.name}</ChakraSteps.Title>
              <ChakraSteps.Content
                index={index}
                flex={1}
                marginTop={2}
                marginBottom={4}
              >
                {s.progress && (
                  <Progress.Root
                    size="sm"
                    variant="subtle"
                    value={(s.progress.current / s.progress.total) * 100}
                    width={150}
                  >
                    <Progress.Track>
                      <Progress.Range />
                    </Progress.Track>
                    <Progress.ValueText style={{ whiteSpace: 'nowrap' }}>
                      {Math.round(
                        (s.progress.current / s.progress.total) * 100,
                      )}
                      % ({s.progress.current.toLocaleString()} /{' '}
                      {s.progress.total.toLocaleString()})
                    </Progress.ValueText>
                  </Progress.Root>
                )}
                {s.status === 'failed' && !!s.error && (
                  <Alert.Root status="error" flexGrow={1}>
                    <Alert.Indicator />
                    <Alert.Content>
                      <Alert.Title>{s.error.name}</Alert.Title>
                      <Alert.Description>{s.error.message}</Alert.Description>
                    </Alert.Content>
                  </Alert.Root>
                )}
              </ChakraSteps.Content>
            </Flex>
            <ChakraSteps.Separator />
          </ChakraSteps.Item>
        ))}
      </ChakraSteps.List>
    </ChakraSteps.Root>
  );
}
