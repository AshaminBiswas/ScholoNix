import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils/cn";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-[#663CF6]/30",
  {
    variants: {
      variant: {
        default:
          "border-[#C8B8FF] bg-[#EDE7FF] text-[#4F27E8] hover:bg-[#E3D9FE] dark:border-[#4D3B94] dark:bg-[#241C4A] dark:text-[#CBB8FF] dark:hover:bg-[#2F2461]",
        brand:
          "border-[#663CF6] bg-[#663CF6] text-white shadow-sm hover:bg-[#4F27E8] dark:border-[#7C5CFF] dark:bg-[#7C5CFF]",
        success:
          "border-[#BBF7D0] bg-[#DCFCE7] text-[#15803D] hover:bg-[#CBFAD7] dark:border-[#1E603A] dark:bg-[#102E20] dark:text-[#6EE7B7] dark:hover:bg-[#143B29]",
        pending:
          "border-[#FDE68A] bg-[#FFF7DF] text-[#B45309] hover:bg-[#FEF0C7] dark:border-[#784915] dark:bg-[#2B1F0B] dark:text-[#FCD34D] dark:hover:bg-[#382910]",
        error:
          "border-[#FECACA] bg-[#FEE2E2] text-[#B91C1C] hover:bg-[#FCD2D2] dark:border-[#7F2424] dark:bg-[#321216] dark:text-[#FCA5A5] dark:hover:bg-[#42181D]",
        info: "border-[#BAE6FD] bg-[#DDF0FF] text-[#0369A1] hover:bg-[#CCE7FD] dark:border-[#1D547A] dark:bg-[#10253A] dark:text-[#7DD3FC] dark:hover:bg-[#15314D]",
        neutral:
          "border-[#E2E8F0] bg-[#F1F2F7] text-[#475569] hover:bg-[#E5E7EB] dark:border-[#2F3557] dark:bg-[#1A1F3B] dark:text-[#B4BDD9] dark:hover:bg-[#23294D]",
        outline:
          "border-[#D9DDF0] bg-white text-[#202044] hover:bg-[#F7F9FE] dark:border-[#30365C] dark:bg-[#141731] dark:text-[#DCE1F9] dark:hover:bg-[#1C2142]",
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
