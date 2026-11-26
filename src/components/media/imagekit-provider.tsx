"use client";

import type { ReactNode } from "react";
import { ImageKitProvider as NextImageKitProvider } from "@imagekit/next";

interface AppImageKitProviderProps {
  children: ReactNode;
  urlEndpoint?: string;
}

/**
 * Provides ImageKit URL context from `@imagekit/next` when `NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT`
 * is configured, falling back to a no-op passthrough in local/unconfigured builds.
 */
export function AppImageKitProvider({ children, urlEndpoint }: AppImageKitProviderProps) {
  const endpoint = (
    urlEndpoint ||
    process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT ||
    ""
  ).trim();

  if (!endpoint) {
    return <>{children}</>;
  }

  return <NextImageKitProvider urlEndpoint={endpoint}>{children}</NextImageKitProvider>;
}
