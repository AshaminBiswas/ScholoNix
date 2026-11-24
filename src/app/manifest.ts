import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ScholoNix - School Management Platform",
    short_name: "ScholoNix",
    description: "Modern cloud-based school management platform for schools",
    start_url: "/",
    display: "standalone",
    background_color: "#FFFFFF",
    theme_color: "#663CF6",
    icons: [
      {
        src: "/favicon-32x32.png",
        sizes: "32x32",
        type: "image/png",
      },
      {
        src: "/android-chrome-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/android-chrome-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
