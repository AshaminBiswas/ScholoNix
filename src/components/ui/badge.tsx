import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils/cn";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-[#663CF6]/30",
  {
    variants: {
      variant: {
        default: "border-[#C8B8FF] bg-[#EDE7FF] text-[#4F27E8] hover:bg-[#E3D9FE]",
        brand: "border-[#663CF6] bg-[#663CF6] text-white shadow-sm hover:bg-[#4F27E8]",
        success: "border-[#BBF7D0] bg-[#DCFCE7] text-[#15803D] hover:bg-[#CBFAD7]",
        pending: "border-[#FDE68A] bg-[#FFF7DF] text-[#B45309] hover:bg-[#FEF0C7]",
        error: "border-[#FECACA] bg-[#FEE2E2] text-[#B91C1C] hover:bg-[#FCD2D2]",
        info: "border-[#BAE6FD] bg-[#DDF0FF] text-[#0369A1] hover:bg-[#CCE7FD]",
        neutral: "border-[#E2E8F0] bg-[#F1F2F7] text-[#475569] hover:bg-[#E5E7EB]",
        outline: "border-[#D9DDF0] bg-white text-[#202044] hover:bg-[#F7F9FE]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
