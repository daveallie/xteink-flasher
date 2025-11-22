'use client';

import React, { ReactNode, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Em,
  Flex,
  Heading,
  Mark,
  Separator,
  Stack,
  Table,
} from '@chakra-ui/react';
import { useEspOperations } from '@/esp/useEspOperations';
import Steps from '@/components/Steps';
import { OtaPartitionState } from '@/esp/OtaPartitionState';
import OtaPartition from '@/esp/OtaPartition';
import HexSpan from '@/components/HexSpan';
import HexViewer from '@/components/HexViewer';

const sampleData = new Uint8Array(0x2000).map(() =>
  Math.round(Math.random() * 255),
);

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
      <HexViewer data={otaPartition.data} />
    </Stack>
  );
}

export default function Debug() {
  const { debugActions, stepData, isRunning } = useEspOperations();
  const [debugOutputNode, setDebugOutputNode] = useState<ReactNode>(null);

  const runOtadataActionWithOutput =
    (fn: () => Promise<OtaPartition>) => async () => {
      const data = await fn();
      setDebugOutputNode(<OtadataDebug otaPartition={data} />);
    };

  return (
    <Flex direction="column" gap="20px">
      <Stack gap={3} as="section">
        <div>
          <Heading size="xl">Debug controls</Heading>
          <Stack gap={1} color="grey" textStyle="sm">
            <p>
              These are few tools to help debugging / administering your Xtink
              device. They&apos;re designed to be used by those who are
              intentionally messing around with their device.
            </p>
            <p>
              <b>Read otadata partition</b> will read and show the details held
              in the <Em>otadata</Em> partition.
            </p>
            <p>
              <b>Swap boot partitions</b> will check the current boot partition
              (app0 or app1) from <Em>otadata</Em> and rewrite the data in the{' '}
              <Em>otadata</Em> to switch the boot partition.
            </p>
          </Stack>
        </div>
        <Stack as="section">
          <Button
            variant="subtle"
            onClick={runOtadataActionWithOutput(debugActions.readDebugOtadata)}
            disabled={isRunning}
          >
            Read otadata partition
          </Button>
          <Button
            variant="subtle"
            onClick={runOtadataActionWithOutput(debugActions.swapBootPartition)}
            disabled={isRunning}
          >
            Swap boot partitions (app0 / app1)
          </Button>
        </Stack>
      </Stack>
      <Separator />
      <HexViewer data={sampleData} />
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
