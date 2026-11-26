import * as React from "react";
import { cn } from "@/lib/utils/cn";

export type SkeletonProps = React.HTMLAttributes<HTMLDivElement>;

/**
 * Accessible, design-system aligned Skeleton primitive.
 * Pulses with soft pearl-lavender tone matching the SaaS design tokens.
 */
export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn("animate-pulse rounded-[10px] bg-[#E9EBF8]/75 dark:bg-[#23284D]/80", className)}
      aria-hidden="true"
      {...props}
    />
  );
}
