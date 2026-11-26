import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[var(--bg-main)] p-6 text-center text-[var(--text-body)]">
      <h1 className="text-2xl font-semibold text-[var(--text-heading)]">Page not found</h1>
      <p className="max-w-md text-sm text-[var(--muted-foreground)]">
        The resource you requested does not exist or is unavailable.
      </p>
      <Link
        href="/"
        className="rounded-md border border-[var(--border)] bg-[var(--bg-card)] px-4 py-2 text-sm font-medium text-[var(--text-heading)] hover:border-[var(--brand-primary)]"
      >
        Return home
      </Link>
    </main>
  );
}
