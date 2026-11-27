/**
 * Bootstrap script to create the initial Company Super Admin in `platform_admins`.
 *
 * Usage:
 *   node scripts/create-platform-admin.mjs --name="Founder" --email="founder@company.com" --password="StrongPassword123!"
 *
 * Or via environment variables:
 *   ADMIN_NAME="Founder" ADMIN_EMAIL="founder@company.com" ADMIN_PASSWORD="..." node scripts/create-platform-admin.mjs
 */
import fs from "fs";
import path from "path";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  const content = fs.readFileSync(filePath, "utf8");
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eqIdx = line.indexOf("=");
    if (eqIdx === -1) continue;
    const key = line.slice(0, eqIdx).trim();
    let val = line.slice(eqIdx + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (process.env[key] === undefined) {
      process.env[key] = val;
    }
  }
}

loadEnvFile(path.resolve(process.cwd(), ".env.local"));
loadEnvFile(path.resolve(process.cwd(), ".env"));

function parseArgs() {
  const args = {};
  for (const arg of process.argv.slice(2)) {
    if (!arg.startsWith("--")) continue;
    const eqIdx = arg.indexOf("=");
    if (eqIdx === -1) continue;
    const key = arg.slice(2, eqIdx).trim();
    const val = arg.slice(eqIdx + 1).trim();
    args[key] = val;
  }
  return {
    name: args.name || process.env.ADMIN_NAME || "",
    email: (args.email || process.env.ADMIN_EMAIL || "").toLowerCase(),
    phone: args.phone || process.env.ADMIN_PHONE || null,
    password: args.password || process.env.ADMIN_PASSWORD || "",
    role: (args.role || process.env.ADMIN_ROLE || "SUPER_ADMIN").toUpperCase(),
  };
}

async function main() {
  const { name, email, phone, password, role } = parseArgs();
  if (!name || !email || !password || password.length < 10) {
    console.error(
      "Usage: node scripts/create-platform-admin.mjs --name=\"Name\" --email=\"admin@company.com\" --password=\"Min10Chars!\"",
    );
    process.exit(1);
  }
  const allowedRoles = new Set(["SUPER_ADMIN", "OPERATIONS", "BILLING_MANAGER", "SUPPORT_AGENT"]);
  if (!allowedRoles.has(role)) {
    console.error("Invalid --role. Allowed: SUPER_ADMIN, OPERATIONS, BILLING_MANAGER, SUPPORT_AGENT");
    process.exit(1);
  }

  const db = new PrismaClient();
  try {
    const passwordHash = await bcrypt.hash(password, 12);
    const created = await db.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT set_config('app.platform_admin', 'true', true)`;
      const existing = await tx.platformAdmin.findUnique({ where: { email } });
      if (existing) {
        throw new Error(`A PlatformAdmin with email "${email}" already exists.`);
      }
      return tx.platformAdmin.create({
        data: {
          name,
          email,
          phone,
          passwordHash,
          role,
          status: "ACTIVE",
          department: "Executive",
        },
        select: { id: true, name: true, email: true, role: true, status: true, createdAt: true },
      });
    });

    console.info("Company Admin created successfully in `platform_admins`:", created);
  } finally {
    await db.$disconnect();
  }
}

main().catch((err) => {
  console.error("Failed to create PlatformAdmin:", err.message || err);
  process.exit(1);
});
