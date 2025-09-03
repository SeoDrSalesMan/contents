"use client";
import React from "react";
import { CacheProvider } from "@emotion/react";
import createEmotionCache from "@/utils/createEmotionCache";

export default function EmotionCacheProvider({ children }: { children: React.ReactNode }) {
  const [cache] = React.useState(() => createEmotionCache());
  return <CacheProvider value={cache}>{children}</CacheProvider>;
}
