import "server-only";

/**
 * Marker module imported by privileged server infrastructure under `src/server/`.
 * Importing this module from a Client Component fails the Next.js build immediately.
 */
export const SERVER_ONLY_BOUNDARY = true as const;
