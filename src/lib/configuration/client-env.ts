import { z } from "zod";

/**
 * Public client-side environment schema.
 * Only variables prefixed with NEXT_PUBLIC_ may be declared here.
 */
const clientEnvSchema = z.object({
  NEXT_PUBLIC_APP_NAME: z.string().default("ScholoNix"),
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().optional(),
});

export type ClientEnv = z.infer<typeof clientEnvSchema>;

let cachedClientEnv: ClientEnv | null = null;

export function getClientEnv(): ClientEnv {
  if (cachedClientEnv) {
    return cachedClientEnv;
  }

  const parsed = clientEnvSchema.safeParse({
    NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  });

  if (!parsed.success) {
    const formatted = parsed.error.issues
      .map((issue) => `[${issue.path.join(".")}]: ${issue.message}`)
      .join("; ");
    throw new Error(`Client environment validation failed: ${formatted}`);
  }

  cachedClientEnv = parsed.data;
  return cachedClientEnv;
}
