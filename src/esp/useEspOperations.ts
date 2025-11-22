'use client';

import { useState } from 'react';
import { getFirmware } from '@/remote/firmwareFetcher';
import { downloadData } from '@/utils/download';
import { wrapWithWakeLock } from '@/utils/wakelock';
import OtaPartition, { OtaPartitionDetails } from './OtaPartition';
import useStepRunner from './useStepRunner';
import EspController from './EspController';

export function useEspOperations() {
  const { stepData, initializeSteps, updateStepData, runStep } =
    useStepRunner();
  const [isRunning, setIsRunning] = useState(false);

  const wrapWithRunning =
    <Args extends unknown[], T>(fn: (...a: Args) => Promise<T>) =>
    async (...a: Args) => {
      setIsRunning(true);
      return fn(...a).finally(() => setIsRunning(false));
    };

  const flashFirmware = async (version: Parameters<typeof getFirmware>[0]) => {
    initializeSteps([
      'Connect to device',
      'Download firmware',
      'Read otadata partition',
      'Flash app partition',
      'Flash otadata partition',
      'Reset device',
    ]);

    const espController = await runStep('Connect to device', async () => {
      const c = await EspController.fromRequestedDevice();
      await c.connect();
      return c;
    });

    const firmwareFile = await runStep('Download firmware', () =>
      getFirmware(version),
    );

    const [otaPartition, backupPartitionLabel] = await runStep(
      'Read otadata partition',
      async (): Promise<
        [OtaPartition, OtaPartitionDetails['partitionLabel']]
      > => {
        const partition = await espController.readOtadataPartition((_, p, t) =>
          updateStepData('Read otadata partition', {
            progress: { current: p, total: t },
          }),
        );

        return [partition, partition.getCurrentBackupPartitionLabel()];
      },
    );

    const flashAppPartitionStepName = `Flash app partition (${backupPartitionLabel})`;
    updateStepData('Flash app partition', { name: flashAppPartitionStepName });
    await runStep(flashAppPartitionStepName, () =>
      espController.writeAppPartition(
        backupPartitionLabel,
        firmwareFile,
        (_, p, t) =>
          updateStepData(flashAppPartitionStepName, {
            progress: { current: p, total: t },
          }),
      ),
    );

    await runStep('Flash otadata partition', async () => {
      otaPartition.setBootPartition(backupPartitionLabel);

      await espController.writeOtadataPartition(otaPartition, (_, p, t) =>
        updateStepData('Flash otadata partition', {
          progress: { current: p, total: t },
        }),
      );
    });

    await runStep('Reset device', () => espController.disconnect());
  };

  const flashEnglishFirmware = async () => flashFirmware('3.0.8-EN');
  const flashChineseFirmware = async () => flashFirmware('3.0.7-CH');

  const saveFullFlash = async () => {
    initializeSteps([
      'Connect to device',
      'Read flash',
      'Disconnect from device',
    ]);

    const espController = await runStep('Connect to device', async () => {
      const c = await EspController.fromRequestedDevice();
      await c.connect();
      return c;
    });

    const firmwareFile = await runStep(
      'Read flash',
      wrapWithWakeLock(() =>
        espController.readFullFlash((_, p, t) =>
          updateStepData('Read flash', { progress: { current: p, total: t } }),
        ),
      ),
    );

    await runStep('Disconnect from device', () =>
      espController.disconnect({ skipReset: true }),
    );

    downloadData(firmwareFile, 'flash.bin', 'application/octet-stream');
  };

  const writeFullFlash = async (getFile: () => File | undefined) => {
    initializeSteps([
      'Read file',
      'Connect to device',
      'Write flash',
      'Reset device',
    ]);

    const fileData = await runStep('Read file', async () => {
      const file = getFile();
      if (!file) {
        throw new Error('File not found');
      }
      return new Uint8Array(await file.arrayBuffer());
    });

    const espController = await runStep('Connect to device', async () => {
      const c = await EspController.fromRequestedDevice();
      await c.connect();
      return c;
    });

    await runStep('Write flash', () =>
      espController.writeFullFlash(fileData, (_, p, t) =>
        updateStepData('Write flash', { progress: { current: p, total: t } }),
      ),
    );

    await runStep('Reset device', () => espController.disconnect());
  };

  const readDebugOtadata = async () => {
    initializeSteps([
      'Connect to device',
      'Read otadata partition',
      'Disconnect from device',
    ]);

    const espController = await runStep('Connect to device', async () => {
      const c = await EspController.fromRequestedDevice();
      await c.connect();
      return c;
    });

    const otaPartition = await runStep('Read otadata partition', () =>
      espController.readOtadataPartition((_, p, t) =>
        updateStepData('Read otadata partition', {
          progress: { current: p, total: t },
        }),
      ),
    );

    await runStep('Disconnect from device', () =>
      espController.disconnect({ skipReset: true }),
    );

    return otaPartition;
  };

  const swapBootPartition = async () => {
    initializeSteps([
      'Connect to device',
      'Read otadata partition',
      'Flash otadata partition',
      'Reset device',
    ]);

    const espController = await runStep('Connect to device', async () => {
      const c = await EspController.fromRequestedDevice();
      await c.connect();
      return c;
    });

    const [otaPartition, backupPartitionLabel] = await runStep(
      'Read otadata partition',
      async (): Promise<
        [OtaPartition, OtaPartitionDetails['partitionLabel']]
      > => {
        const partition = await espController.readOtadataPartition((_, p, t) =>
          updateStepData('Read otadata partition', {
            progress: { current: p, total: t },
          }),
        );

        return [partition, partition.getCurrentBackupPartitionLabel()];
      },
    );

    otaPartition.setBootPartition(backupPartitionLabel);
    await runStep('Flash otadata partition', () =>
      espController.writeOtadataPartition(otaPartition, (_, p, t) =>
        updateStepData('Flash otadata partition', {
          progress: { current: p, total: t },
        }),
      ),
    );

    await runStep('Reset device', () => espController.disconnect());

    return otaPartition;
  };

  const fakeWriteFullFlash = async () => {
    initializeSteps([
      'Read file',
      'Connect to device',
      'Write flash',
      'Reset device',
    ]);

    await runStep(
      'Read file',
      () =>
        new Promise((resolve) => {
          setTimeout(resolve, 100);
        }),
    );

    await runStep(
      'Connect to device',
      () =>
        new Promise((resolve) => {
          setTimeout(resolve, 500);
        }),
    );

    await runStep(
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

    await runStep(
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
      fakeWriteFullFlash: wrapWithRunning(fakeWriteFullFlash),
    },
    debugActions: {
      readDebugOtadata: wrapWithRunning(readDebugOtadata),
      swapBootPartition: wrapWithRunning(swapBootPartition),
    },
  };
}
