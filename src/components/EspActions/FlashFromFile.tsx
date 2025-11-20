'use client';

import React, { useRef } from 'react';
import { Button, Flex } from '@chakra-ui/react';
import FileUpload, { FileUploadHandle } from '@/components/FileUpload';

export default function FlashFromFile({
  onClick,
  disabled,
}: {
  onClick: (getFile: () => File | undefined) => void;
  disabled?: boolean;
}) {
  const fileInput = useRef<FileUploadHandle>(null);
  const getFile = () => fileInput.current?.getFile();

  return (
    <Flex>
      <FileUpload ref={fileInput} />
      <Button
        style={{ flexGrow: 1 }}
        onClick={() => onClick(getFile)}
        disabled={disabled}
      >
        Write full flash from file
      </Button>
    </Flex>
  );
}
