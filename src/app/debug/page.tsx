'use client';

import React, { ReactNode, useState } from 'react';
import {
  Alert,
  Badge,
  Button,
  Card,
  CloseButton,
  Dialog,
  Em,
  Flex,
  Heading,
  Mark,
  Portal,
  Separator,
  Stack,
  Table,
  Text,
  SimpleGrid,
} from '@chakra-ui/react';
import { useEspOperations } from '@/esp/useEspOperations';
import Steps from '@/components/Steps';
import { OtaPartitionState } from '@/esp/OtaPartitionState';
import OtaPartition, { OtaPartitionDetails } from '@/esp/OtaPartition';
import HexSpan from '@/components/HexSpan';
import HexViewer from '@/components/HexViewer';
import { downloadData } from '@/utils/download';
import { FirmwareInfo } from '@/utils/firmwareIdentifier';

function OtadataDebug({ otaPartition }: { otaPartition: OtaPartition }) {
  const bootPartitionLabel = otaPartition.getCurrentBootPartitionLabel();

  return (
    <Stack>
      <Heading size="lg">OTA data</Heading>
      <Stack direction="row">
        {otaPartition.otaAppPartitions().map((partition) => (
          <Card.Root
            variant="subtle"
            size="sm"
            key={partition.partitionLabel}
            colorPalette="red"
          >
            <Card.Header>
              <Heading size="md">Partition {partition.partitionLabel}</Heading>
            </Card.Header>
            <Card.Body>
              <Table.Root size="sm">
                <Table.Body>
                  <Table.Row>
                    <Table.Cell>Boot Partition:</Table.Cell>
                    <Table.Cell>
                      <Mark
                        colorPalette={
                          partition.partitionLabel === bootPartitionLabel
                            ? 'green'
                            : 'red'
                        }
                        variant="solid"
                        paddingLeft={1}
                        paddingRight={1}
                      >
                        {partition.partitionLabel === bootPartitionLabel
                          ? 'Yes'
                          : 'No'}
                      </Mark>
                    </Table.Cell>
                  </Table.Row>
                  <Table.Row>
                    <Table.Cell>OTA Sequence:</Table.Cell>
                    <Table.Cell>{partition.sequence}</Table.Cell>
                  </Table.Row>
                  <Table.Row>
                    <Table.Cell>OTA State:</Table.Cell>
                    <Table.Cell>
                      <Mark
                        colorPalette={
                          [
                            OtaPartitionState.ABORTED,
                            OtaPartitionState.INVALID,
                          ].includes(partition.state)
                            ? 'red'
                            : 'green'
                        }
                        variant="solid"
                        paddingLeft={1}
                        paddingRight={1}
                      >
                        {partition.state}
                      </Mark>{' '}
                    </Table.Cell>
                  </Table.Row>
                  <Table.Row>
                    <Table.Cell>CRC32 Bytes:</Table.Cell>
                    <Table.Cell>
                      <HexSpan data={partition.crcBytes} />
                    </Table.Cell>
                  </Table.Row>
                  <Table.Row>
                    <Table.Cell>CRC32 Valid:</Table.Cell>
                    <Table.Cell>
                      <Mark
                        colorPalette={partition.crcValid ? 'green' : 'red'}
                        variant="solid"
                        paddingLeft={1}
                        paddingRight={1}
                      >
                        {partition.crcValid ? 'Yes' : 'No'}
                      </Mark>
                    </Table.Cell>
                  </Table.Row>
                </Table.Body>
              </Table.Root>
            </Card.Body>
          </Card.Root>
        ))}
      </Stack>
      <Dialog.Root size="xl" modal>
        <Dialog.Trigger asChild>
          <Button variant="outline">View Raw Data</Button>
        </Dialog.Trigger>
        <Portal>
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content>
              <Dialog.Header>
                <Dialog.Title>Raw Data</Dialog.Title>
              </Dialog.Header>
              <Dialog.CloseTrigger asChild>
                <CloseButton size="sm" />
              </Dialog.CloseTrigger>
              <Dialog.Body>
                <HexViewer data={otaPartition.data} />
              </Dialog.Body>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>
      <Button
        variant="outline"
        onClick={() =>
          downloadData(
            otaPartition.data,
            'otadata.bin',
            'application/octet-stream',
          )
        }
      >
        Download Raw Data
      </Button>
    </Stack>
  );
}

function AppDebug({
  appPartitionData,
  partitionLabel,
}: {
  appPartitionData: Uint8Array;
  partitionLabel: OtaPartitionDetails['partitionLabel'];
}) {
  return (
    <Stack>
      <Heading size="lg">App partition data ({partitionLabel})</Heading>
      <Dialog.Root size="xl" modal>
        <Dialog.Trigger asChild>
          <Button variant="outline">View Raw Data</Button>
        </Dialog.Trigger>
        <Portal>
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content>
              <Dialog.Header>
                <Dialog.Title>Raw Data</Dialog.Title>
              </Dialog.Header>
              <Dialog.CloseTrigger asChild>
                <CloseButton size="sm" />
              </Dialog.CloseTrigger>
              <Dialog.Body>
                <HexViewer data={appPartitionData} />
              </Dialog.Body>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>
      <Button
        variant="outline"
        onClick={() =>
          downloadData(
            appPartitionData,
            `${partitionLabel}.bin`,
            'application/octet-stream',
          )
        }
      >
        Download Raw Data
      </Button>
    </Stack>
  );
}

function FirmwareIdentificationDebug({
  app0: app0Info,
  app1: app1Info,
  currentBoot,
}: {
  app0: FirmwareInfo;
  app1: FirmwareInfo;
  currentBoot: 'app0' | 'app1';
}) {
  const getColorPalette = (
    type: FirmwareInfo['type'],
  ): 'green' | 'orange' | 'blue' | 'gray' => {
    switch (type) {
      case 'official-english':
      case 'official-chinese':
        return 'green';
      case 'crosspoint':
        return 'blue';
      case 'unknown':
      default:
        return 'orange';
    }
  };

  return (
    <Stack>
      <Heading size="lg">Firmware Information</Heading>
      <SimpleGrid columns={{ sm: 1, md: 2 }} gap={4}>
        {[
          { label: 'app0', info: app0Info },
          { label: 'app1', info: app1Info },
        ].map(({ label, info }) => (
          <Card.Root
            variant="subtle"
            size="sm"
            key={label}
            colorPalette={getColorPalette(info.type)}
          >
            <Card.Header>
              <Flex alignItems="center" gap={2}>
                <Heading size="md">Partition {label}</Heading>
                {label === currentBoot && (
                  <Badge colorPalette="green" variant="solid" size="sm">
                    Active
                  </Badge>
                )}
              </Flex>
            </Card.Header>
            <Card.Body>
              <Stack gap={2}>
                <div>
                  <Text fontWeight="bold">Firmware:</Text>
                  <Text>{info.displayName}</Text>
                </div>
                <div>
                  <Text fontWeight="bold">Version:</Text>
                  <Text>{info.version}</Text>
                </div>
                <div>
                  <Text fontWeight="bold">Type:</Text>
                  <Text>{info.type}</Text>
                </div>
              </Stack>
            </Card.Body>
          </Card.Root>
        ))}
      </SimpleGrid>
    </Stack>
  );
}

export default function Debug() {
  const { debugActions, stepData, isRunning } = useEspOperations();
  const [debugOutputNode, setDebugOutputNode] = useState<ReactNode>(null);

  return (
    <Flex direction="column" gap="20px">
      <Stack gap={3} as="section">
        <div>
          <Heading size="xl">Debug controls</Heading>
          <Stack gap={1} color="grey" textStyle="sm">
            <p>
              These are few tools to help debugging / administering your Xtink
              device. They’re designed to be used by those who are intentionally
              messing around with their device.
            </p>
            <p>
              <b>Read otadata partition</b> will read the raw data out of the{' '}
              <Em>otadata</Em> partition and allow you to inspect or download
              the contents.
            </p>
            <p>
              <b>Read app partition</b> will read the raw data out of the
              selected app partition and allow you to inspect or download the
              contents.
            </p>
            <p>
              <b>Swap boot partitions</b> will check the current boot partition
              (app0 or app1) from <Em>otadata</Em> and rewrite the data in the{' '}
              <Em>otadata</Em> to switch the boot partition.
            </p>
            <p>
              <b>Identify firmware in both partitions</b> will read both app0
              and app1 partitions and automatically identify which firmware is
              installed on each (Official English, Official Chinese, CrossPoint
              Community, or Custom).
            </p>
          </Stack>
        </div>
        <Stack as="section">
          <Button
            variant="subtle"
            onClick={() => {
              debugActions
                .readDebugOtadata()
                .then((data) =>
                  setDebugOutputNode(<OtadataDebug otaPartition={data} />),
                );
            }}
            disabled={isRunning}
          >
            Read otadata partition
          </Button>
          <Button
            variant="subtle"
            onClick={() => {
              debugActions
                .readAppPartition('app0')
                .then((data) =>
                  setDebugOutputNode(
                    <AppDebug appPartitionData={data} partitionLabel="app0" />,
                  ),
                );
            }}
            disabled={isRunning}
          >
            Read app0 partition
          </Button>
          <Button
            variant="subtle"
            onClick={() => {
              debugActions
                .readAppPartition('app1')
                .then((data) =>
                  setDebugOutputNode(
                    <AppDebug appPartitionData={data} partitionLabel="app1" />,
                  ),
                );
            }}
            disabled={isRunning}
          >
            Read app1 partition
          </Button>
          <Button
            variant="subtle"
            onClick={() => {
              debugActions
                .swapBootPartition()
                .then((data) =>
                  setDebugOutputNode(<OtadataDebug otaPartition={data} />),
                );
            }}
            disabled={isRunning}
          >
            Swap boot partitions (app0 / app1)
          </Button>
          <Button
            variant="subtle"
            onClick={() => {
              debugActions
                .readAndIdentifyAllFirmware()
                .then((data) =>
                  setDebugOutputNode(
                    <FirmwareIdentificationDebug
                      app0={data.app0}
                      app1={data.app1}
                      currentBoot={data.currentBoot}
                    />,
                  ),
                );
            }}
            disabled={isRunning}
          >
            Identify firmware in both partitions
          </Button>
        </Stack>
      </Stack>
      <Separator />
      <Card.Root variant="subtle">
        <Card.Header>
          <Heading size="lg">Steps</Heading>
        </Card.Header>
        <Card.Body>
          {stepData.length > 0 ? (
            <Steps steps={stepData} />
          ) : (
            <Alert.Root status="info" variant="surface">
              <Alert.Indicator />
              <Alert.Title>
                Progress will be shown here once you start an operation
              </Alert.Title>
            </Alert.Root>
          )}
        </Card.Body>
      </Card.Root>
      {!isRunning && !!debugOutputNode ? (
        <>
          <Separator />
          {debugOutputNode}
        </>
      ) : null}
    </Flex>
  );
}
