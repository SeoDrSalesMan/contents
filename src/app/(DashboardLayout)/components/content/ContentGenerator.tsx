"use client";
import React from "react";
import { Box, CssBaseline, ThemeProvider, createTheme, Toolbar } from "@mui/material";
import { ContentSettingsProvider } from "./ContentSettingsContext";

const theme = createTheme({ palette: { mode: "light" } });

export default function ContentGenerator({ children }: { children: React.ReactNode }): JSX.Element {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <ContentSettingsProvider>
        <Box sx={{ minHeight: "100vh", display: "flex" }}>
          <Box component="main" sx={{ flex: 1, p: 3 }}>
            <Toolbar sx={{ minHeight: 0, p: 0 }} />
            {children}
          </Box>
        </Box>
      </ContentSettingsProvider>
    </ThemeProvider>
  );
}
