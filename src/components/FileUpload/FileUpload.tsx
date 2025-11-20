import React, { Ref, useImperativeHandle } from 'react';
import {
  FileUpload as ChakraUpload,
  CloseButton,
  Input,
  InputGroup,
  useFileUpload,
} from '@chakra-ui/react';
import { LuFileUp } from 'react-icons/lu';

export interface FileUploadHandle {
  getFile: () => File | undefined;
}

export default function FileUpload({
  ref,
  disabled,
}: {
  ref: Ref<FileUploadHandle>;
  disabled?: boolean;
}) {
  const fileUpload = useFileUpload({
    maxFiles: 1,
  });

  useImperativeHandle(ref, () => ({
    getFile: () => fileUpload.acceptedFiles[0],
  }));

  return (
    <ChakraUpload.RootProvider gap="1" value={fileUpload}>
      <ChakraUpload.HiddenInput />
      <InputGroup
        startElement={<LuFileUp />}
        endElement={
          <ChakraUpload.ClearTrigger asChild>
            <CloseButton
              me="-1"
              size="xs"
              variant="plain"
              focusVisibleRing="inside"
              focusRingWidth="2px"
              pointerEvents="auto"
            />
          </ChakraUpload.ClearTrigger>
        }
      >
        <Input asChild disabled={disabled}>
          <ChakraUpload.Trigger>
            <ChakraUpload.FileText lineClamp={1} />
          </ChakraUpload.Trigger>
        </Input>
      </InputGroup>
    </ChakraUpload.RootProvider>
  );
}
