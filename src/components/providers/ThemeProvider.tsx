"use client";

import { baselightTheme } from "@/utils/theme/DefaultColors";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import EmotionCacheProvider from "../../app/EmotionCacheProvider";
import { ContentSettingsProvider } from "@/app/(DashboardLayout)/components/content/ContentSettingsContext";

export default function Providers({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <EmotionCacheProvider>
      <ContentSettingsProvider>
        <ThemeProvider theme={baselightTheme}>
          <CssBaseline />
          {children}
        </ThemeProvider>
      </ContentSettingsProvider>
    </EmotionCacheProvider>
  );
}
