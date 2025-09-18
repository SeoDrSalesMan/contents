"use client";
import Providers from "@/components/providers/ThemeProvider";
import './global.css';
import { useEffect } from 'react';

// Suppress browser extension runtime errors and hydration warnings
const suppressExtensionErrors = () => {
  const originalLogError = console.error;
  console.error = (...args) => {
    // Suppress specific browser extension runtime errors
    if (
      args &&
      typeof args[0] === 'string' &&
      (
        args[0].includes('runtime.lastError') ||
        args[0].includes('Extension context invalidated') ||
        args[0].includes('message port closed') ||
        args[0].includes('bis_skin_checked') ||
        args[0].includes('Hydration failed because') ||
        args[0].includes('Warning: Expected server HTML to contain a matching') ||
        args[0].includes('Warning: clock is in 12-hour format')
      )
    ) {
      return;
    }
    originalLogError.apply(console, args);
  };
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    suppressExtensionErrors();
  }, []);

  return (
    <html lang="en">
      <head>
        <meta name="emotion-insertion-point" content="" />
      </head>
      <body suppressHydrationWarning>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
