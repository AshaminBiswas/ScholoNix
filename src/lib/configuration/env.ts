import "server-only";
import { z } from "zod";

/**
 * Server-only environment variable validation schema.
 * Prevents accidental startup or build execution with missing critical configurations.
 */
export const serverEnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),

  // Database
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  DIRECT_URL: z.string().min(1, "DIRECT_URL is required").optional(),

  // Redis & Jobs
  REDIS_URL: z
    .string()
    .url("REDIS_URL must be a valid URL")
    .default("redis://localhost:6379"),
  UPSTASH_REDIS_REST_URL: z
    .string()
    .trim()
    .optional()
    .refine((value) => {
      if (!value) return true;
      try {
        const parsed = new URL(value);
        return parsed.protocol === "https:" || parsed.protocol === "http:";
      } catch {
        return false;
      }
    }, "UPSTASH_REDIS_REST_URL must be a valid HTTP(S) URL"),
  UPSTASH_REDIS_REST_TOKEN: z.string().trim().optional(),
  KV_REST_API_URL: z
    .string()
    .trim()
    .optional()
    .refine((value) => {
      if (!value) return true;
      try {
        const parsed = new URL(value);
        return parsed.protocol === "https:" || parsed.protocol === "http:";
      } catch {
        return false;
      }
    }, "KV_REST_API_URL must be a valid HTTP(S) URL"),
  KV_REST_API_TOKEN: z.string().trim().optional(),

  // Authentication
  AUTH_SECRET: z
    .string()
    .min(32, "AUTH_SECRET must be at least 32 characters for secure session hashing"),
  AUTH_SESSION_TTL_SECONDS: z.coerce.number().default(28800),
  AUTH_COOKIE_NAME: z.string().default("__Host-school_session"),
  PLATFORM_ADMIN_SLUG: z
    .string()
    .trim()
    .regex(/^[a-z0-9-_]{6,64}$/i, "PLATFORM_ADMIN_SLUG must be 6-64 alphanumeric, dash, or underscore characters")
    .optional()
    .or(z.literal("")),

  // Logging & Observability
  LOG_LEVEL: z.enum(["trace", "debug", "info", "warn", "error", "fatal"]).default("info"),
  SENTRY_DSN: z.string().url().optional().or(z.literal("")),
  NEXT_PUBLIC_SENTRY_DSN: z.string().url().optional().or(z.literal("")),
  NEXT_PUBLIC_GLITCHTIP_TRACES_SAMPLE_RATE: z.string().optional().or(z.literal("")),
  SENTRY_URL: z.string().url().optional().or(z.literal("")),
  SENTRY_ORG: z.string().optional().or(z.literal("")),
  SENTRY_PROJECT: z.string().optional().or(z.literal("")),
  SENTRY_AUTH_TOKEN: z.string().optional().or(z.literal("")),
  OTEL_EXPORTER_OTLP_ENDPOINT: z.string().url().optional().or(z.literal("")),

  // Email notifications (optional integrations)
  EMAIL_PROVIDER: z.string().default("smtp"),
  EMAIL_PROVIDER_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().email().default("noreply@example.com"),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),

  // SMS notifications (optional integrations)
  SMS_PROVIDER: z.string().optional(),
  SMS_API_KEY: z.string().optional(),
  TWILIO_ACCOUNT_SID: z.string().optional(),
  TWILIO_AUTH_TOKEN: z.string().optional(),
  TWILIO_PHONE_NUMBER: z.string().optional(),
  RENFLAIR_API_KEY: z.string().optional(),

  // MSG91 configuration
  MSG91_AUTH_KEY: z.string().optional(),
  MSG91_OTP_TEMPLATE_ID: z.string().optional(),
  MSG91_TEMPLATE_ID: z.string().optional(),

  // Object storage & media CDN (ImageKit active, S3/Cloudflare R2-ready)
  STORAGE_PROVIDER: z.enum(["auto", "imagekit", "local", "r2"]).default("auto"),
  IMAGEKIT_PUBLIC_KEY: z.string().optional(),
  IMAGEKIT_PRIVATE_KEY: z.string().optional(),
  IMAGEKIT_URL_ENDPOINT: z.string().url().optional().or(z.literal("")),
  IMAGEKIT_BASE_FOLDER: z.string().default("/scholonix"),
  NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY: z.string().optional(),
  NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT: z.string().url().optional().or(z.literal("")),

  OBJECT_STORAGE_ENDPOINT: z.string().optional(),
  OBJECT_STORAGE_REGION: z.string().default("us-east-1"),
  OBJECT_STORAGE_BUCKET: z.string().optional(),
  OBJECT_STORAGE_ACCESS_KEY: z.string().optional(),
  OBJECT_STORAGE_SECRET_KEY: z.string().optional(),

  // Payments (optional integrations)
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  RAZORPAY_KEY_ID: z.string().optional(),
  RAZORPAY_KEY_SECRET: z.string().optional(),
  RAZORPAY_WEBHOOK_SECRET: z.string().optional(),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

let cachedEnv: ServerEnv | null = null;

/**
 * Lazily validates and caches server-side environment variables.
 * Fails fast with descriptive error messages when required variables are missing.
 */
export function getServerEnv(): ServerEnv {
  if (cachedEnv) {
    return cachedEnv;
  }

  const parsed = serverEnvSchema.safeParse(process.env);
  if (!parsed.success) {
    const formatted = parsed.error.issues
      .map((issue) => `[${issue.path.join(".")}]: ${issue.message}`)
      .join("; ");
    throw new Error(`Environment validation failed: ${formatted}`);
  }

  cachedEnv = parsed.data;
  return cachedEnv;
}
