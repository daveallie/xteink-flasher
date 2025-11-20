import React from 'react';
import type { Metadata } from 'next';
import './globals.css';
import { Provider } from '@/components/ui/provider';

export const metadata: Metadata = {
  title: 'Xteink Flash Tools',
  description: 'Web based tool to help flash the Xteink device',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Provider>{children}</Provider>
      </body>
    </html>
  );
}
