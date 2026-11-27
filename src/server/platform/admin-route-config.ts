import "server-only";

const ADMIN_SLUG_REGEX = /^[a-z0-9-_]{6,64}$/;

/**
 * Returns the configured secret Company Admin path segment (`PLATFORM_ADMIN_SLUG`),
 * or `null` if none is configured. When set, `/admin` is disabled (404) and only
 * `/{PLATFORM_ADMIN_SLUG}` serves the Company Admin Panel.
 */
export function getConfiguredPlatformAdminSlug(): string | null {
  const raw = process.env.PLATFORM_ADMIN_SLUG?.trim().replace(/^\/+|\/+$/g, "").toLowerCase();
  if (!raw || raw === "admin") return null;
  if (!ADMIN_SLUG_REGEX.test(raw)) return null;
  return raw;
}

/**
 * Resolves the active path for the Company Admin Panel (`/{PLATFORM_ADMIN_SLUG}` or `/admin`).
 */
export function getPlatformAdminPath(): string {
  const customSlug = getConfiguredPlatformAdminSlug();
  return customSlug ? `/${customSlug}` : "/admin";
}
