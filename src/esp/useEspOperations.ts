'use client';

import { useState } from 'react';
import { getFirmware } from '@/remote/firmwareFetcher';
import { StepData } from '@/types/Step';
import { downloadData } from '@/utils/download';
import { wrapWithWakeLock } from '@/utils/wakelock';
import EspController from './EspController';

export function useEspOperations() {
  const [stepData, setStepData] = useState<StepData[]>([]);
  const [isRunning, setIsRunning] = useState(false);

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

  const wrapWithRunning =
    <Args extends unknown[], T>(fn: (...a: Args) => Promise<T>) =>
    async (...a: Args) => {
      setIsRunning(true);
      return fn(...a).finally(() => setIsRunning(false));
    };

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-constraint
  const wrapWithStep = async <T extends unknown>(
    stepName: string,
    fn: () => Promise<T>,
  ): Promise<T> => {
    updateStepData(stepName, { status: 'running' });
    const res = await fn().catch((e) => {
      updateStepData(stepName, {
        status: 'failed',
        error: e,
      });
      throw e;
    });
    updateStepData(stepName, { status: 'success' });
    return res;
  };

  const flashFirmware = async (version: Parameters<typeof getFirmware>[0]) => {
    setStepData([
      { name: 'Connect to device', status: 'pending' },
      { name: 'Download firmware', status: 'pending' },
      { name: 'Read otadata partition', status: 'pending' },
      { name: 'Flash app partition', status: 'pending' },
      { name: 'Flash otadata partition', status: 'pending' },
      { name: 'Reset device', status: 'pending' },
    ]);

    const espController = await wrapWithStep('Connect to device', async () => {
      const c = await EspController.fromRequestedDevice();
      await c.connect();
      return c;
    });

    const firmwareFile = await wrapWithStep('Download firmware', () =>
      getFirmware(version),
    );

    const otaPartition = await wrapWithStep('Read otadata partition', () =>
      espController.readOtadataPartition((_, p, t) =>
        updateStepData('Read otadata partition', {
          progress: { current: p, total: t },
        }),
      ),
    );

    const currentBootPartition = otaPartition.getCurrentBootPartition();
    const nextBootPartition =
      currentBootPartition?.partitionLabel === 'app1' ? 'app0' : 'app1';

    await wrapWithStep('Flash app partition', () =>
      espController.writeAppPartition(
        nextBootPartition,
        firmwareFile,
        (_, p, t) =>
          updateStepData('Flash app partition', {
            progress: { current: p, total: t },
          }),
      ),
    );

    otaPartition.setBootPartition(nextBootPartition);
    await wrapWithStep('Flash otadata partition', () =>
      espController.writeOtadataPartition(otaPartition, (_, p, t) =>
        updateStepData('Flash otadata partition', {
          progress: { current: p, total: t },
        }),
      ),
    );

    await wrapWithStep('Reset device', () => espController.disconnect());
  };

  const flashEnglishFirmware = async () => flashFirmware('3.0.8-EN');
  const flashChineseFirmware = async () => flashFirmware('3.0.7-CH');

  const saveFullFlash = async () => {
    setStepData([
      { name: 'Connect to device', status: 'pending' },
      { name: 'Read flash', status: 'pending' },
      { name: 'Disconnect from device', status: 'pending' },
    ]);

    const espController = await wrapWithStep('Connect to device', async () => {
      const c = await EspController.fromRequestedDevice();
      await c.connect();
      return c;
    });

    const firmwareFile = await wrapWithStep(
      'Read flash',
      wrapWithWakeLock(() =>
        espController.readFullFlash((_, p, t) =>
          updateStepData('Read flash', { progress: { current: p, total: t } }),
        ),
      ),
    );

    await wrapWithStep('Disconnect from device', () =>
      espController.disconnect({ skipReset: true }),
    );

    downloadData(firmwareFile, 'flash.bin', 'application/octet-stream');
  };

  const writeFullFlash = async (getFile: () => File | undefined) => {
    setStepData([
      { name: 'Read file', status: 'pending' },
      { name: 'Connect to device', status: 'pending' },
      { name: 'Write flash', status: 'pending' },
      { name: 'Reset device', status: 'pending' },
    ]);

    const fileData = await wrapWithStep('Read file', async () => {
      const file = getFile();
      if (!file) {
        throw new Error('File not found');
      }
      return new Uint8Array(await file.arrayBuffer());
    });

    const espController = await wrapWithStep('Connect to device', async () => {
      const c = await EspController.fromRequestedDevice();
      await c.connect();
      return c;
    });

    await wrapWithStep('Write flash', () =>
      espController.writeFullFlash(fileData, (_, p, t) =>
        updateStepData('Write flash', { progress: { current: p, total: t } }),
      ),
    );

    await wrapWithStep('Reset device', () => espController.disconnect());
  };

  const debugSteps2 = async () => {
    setStepData([
      { name: 'Read file', status: 'pending' },
      { name: 'Connect to device', status: 'pending' },
      { name: 'Write flash', status: 'pending' },
      { name: 'Reset device', status: 'pending' },
    ]);

    await wrapWithStep(
      'Read file',
      () =>
        new Promise((resolve) => {
          setTimeout(resolve, 100);
        }),
    );

    await wrapWithStep(
      'Connect to device',
      () =>
        new Promise((resolve) => {
          setTimeout(resolve, 500);
        }),
    );

    await wrapWithStep(
      'Write flash',
      () =>
        new Promise((resolve, reject) => {
          let value = 0;
          const interval = setInterval(() => {
            if (value > 1) {
              clearInterval(interval);
              resolve(undefined);
              return;
            }

            if (value > 0.2) {
              clearInterval(interval);
              reject(new Error('Whoops, failed!'));
              return;
            }

            value += 0.001;
            updateStepData('Write flash', {
              progress: { current: value * 1000000, total: 1000000 },
            });
          }, 20);
        }),
    );

    await wrapWithStep(
      'Reset device',
      () =>
        new Promise((resolve) => {
          setTimeout(resolve, 500);
        }),
    );
  };

  return {
    stepData,
    isRunning,
    actions: {
      flashEnglishFirmware: wrapWithRunning(flashEnglishFirmware),
      flashChineseFirmware: wrapWithRunning(flashChineseFirmware),
      saveFullFlash: wrapWithRunning(saveFullFlash),
      writeFullFlash: wrapWithRunning(writeFullFlash),
      debugSteps2: wrapWithRunning(debugSteps2),
    },
  };
}
