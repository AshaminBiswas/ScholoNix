"use client";

import NextImage, { type ImageProps as NextImageProps } from "next/image";
import { Image as ImageKitImage, type IKImageProps } from "@imagekit/next";

type AppMediaImageProps = Omit<IKImageProps, "urlEndpoint"> & {
  urlEndpoint?: string;
};

/**
 * Unified responsive image component backed by `@imagekit/next` when configured,
 * gracefully falling back to standard Next.js `<Image>` for local/public assets.
 */
export function AppMediaImage({ urlEndpoint, transformation, responsive, ...rest }: AppMediaImageProps) {
  const endpoint = (
    urlEndpoint ||
    process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT ||
    ""
  ).trim();

  if (!endpoint) {
    return <NextImage {...(rest as NextImageProps)} />;
  }

  return (
    <ImageKitImage
      urlEndpoint={endpoint}
      transformation={transformation}
      responsive={responsive}
      {...rest}
    />
  );
}
