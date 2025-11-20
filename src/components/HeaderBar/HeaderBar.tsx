'use client';

import React from 'react';
import { Box, Container, Flex, Heading, IconButton } from '@chakra-ui/react';
import { ColorModeButton, useColorModeValue } from '@/components/ui/color-mode';
import { LuGithub } from 'react-icons/lu';

export default function HeaderBar() {
  return (
    <Box bg={useColorModeValue('gray.100', 'gray.900')} px={4}>
      <Container maxW="3xl">
        <Flex h={16} alignItems="center" justifyContent="space-between">
          <Heading size="md" color={useColorModeValue('gray.700', 'gray.300')}>
            Xteink Flash Tools
          </Heading>

          <Flex alignItems="center" gap={2}>
            <IconButton
              variant="outline"
              onClick={() =>
                window.open(
                  'https://github.com/daveallie/xteink-flasher',
                  '_blank',
                )
              }
              aria-label="Go to Github repo"
            >
              <LuGithub />
            </IconButton>
            <ColorModeButton variant="outline" />
          </Flex>
        </Flex>
      </Container>
    </Box>
  );
}
