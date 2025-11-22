'use client';

import React, { useRef } from 'react';
import {
  Text,
  Button,
  Heading,
  Em,
  Separator,
  Card,
  Alert,
  Container,
  Stack,
  Flex,
} from '@chakra-ui/react';
import FileUpload, { FileUploadHandle } from '@/components/FileUpload';
import Steps from '@/components/Steps';
import { useEspOperations } from '@/esp/useEspOperations';
import HeaderBar from '@/components/HeaderBar/HeaderBar';

export default function Home() {
  const { actions, stepData, isRunning } = useEspOperations();
  const fileInput = useRef<FileUploadHandle>(null);
  const getFile = () => fileInput.current?.getFile();

  return (
    <>
      <HeaderBar />
      <Container
        as="main"
        maxW="3xl"
        gap="20px"
        display="flex"
        flexDirection="column"
        mt={5}
        mb={5}
      >
        <Alert.Root status="warning">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Title>Proceed with caution</Alert.Title>
            <Alert.Description>
              <Stack>
                <p>
                  I&apos;ve tried to make this foolproof and while the
                  likelihood of unrecoverable things going wrong is extremely
                  low, it&apos;s never zero. So proceed with care and make sure
                  to grab a backup using <b>Save full flash</b> before flashing
                  your device.
                </p>
                <p>
                  Once you start <b>Write flash from file</b> or{' '}
                  <b>Flash English firmware</b>, you should avoid disconnecting
                  your device or closing the tab until the operation is
                  complete. Writing a full flash from your backup should always
                  restore your device to its old state.
                </p>
              </Stack>
            </Alert.Description>
          </Alert.Content>
        </Alert.Root>

        <Stack gap="10px" as="section">
          <div>
            <Heading size="xl">Full flash controls</Heading>
            <Text color="grey" textStyle="sm">
              These actions will allow you to take a full backup your Xteink
              device in order to be able to restore it in the case that anything
              goes wrong.
              <br />
              <b>Save full flash</b> will read your device&apos;s flash and save
              it as <Em>flash.bin</Em>. This will take around 25 minutes to
              complete. You can use that file (or someone else&apos;s) with{' '}
              <b>Write full flash from file</b> to overwrite your device&apos;s
              entire flash.
            </Text>
          </div>
          <Stack gap="4px" as="section">
            <Button
              variant="subtle"
              onClick={actions.saveFullFlash}
              disabled={isRunning}
            >
              Save full flash
            </Button>
            <Stack direction="row" gap="8px">
              <Flex grow={1}>
                <FileUpload ref={fileInput} />
              </Flex>
              <Button
                variant="subtle"
                flexGrow={1}
                onClick={() => actions.writeFullFlash(getFile)}
                disabled={isRunning}
              >
                Write full flash from file
              </Button>
            </Stack>
          </Stack>
        </Stack>
        <Separator />
        <Stack gap="10px" as="section">
          <div>
            <Heading size="xl">OTA fast flash controls</Heading>
            <Text color="grey" textStyle="sm">
              Before using this, I&apos;d strongly recommend taking a backup of
              your device using <b>Save full flash</b> above.
              <br />
              <b>Flash English firmware</b> will download the English firmware,
              clear the OTA partition on your device and overwrite the OTA_0
              partition with the new firmware. This is significantly faster than
              a full flash write and will retain all your settings. If it goes
              wrong, it should be fine to run again.
            </Text>
          </div>
          <Stack gap="4px" as="section">
            <Button
              variant="subtle"
              onClick={actions.flashEnglishFirmware}
              disabled={isRunning}
            >
              Flash English firmware (3.0.8)
            </Button>
            <Button
              variant="subtle"
              onClick={actions.flashChineseFirmware}
              disabled={isRunning}
            >
              Flash Chinese firmware (3.0.7)
            </Button>
            {process.env.NODE_ENV === 'development' && (
              <Button
                variant="subtle"
                onClick={actions.debugSteps2}
                disabled={isRunning}
              >
                debug
              </Button>
            )}
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
        <Alert.Root status="info">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Title>Device restart instructions</Alert.Title>
            <Alert.Description>
              Once you complete a write operation, you will need to restart your
              device by pressing the small button on the bottom right and then
              holding the power button.
            </Alert.Description>
          </Alert.Content>
        </Alert.Root>
      </Container>
    </>
  );
}
