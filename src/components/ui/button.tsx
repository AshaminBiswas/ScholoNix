import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils/cn";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[12px] text-sm font-semibold transition-all duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#663CF6]/35 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-[#663CF6] text-white shadow-[0_4px_14px_rgba(102,60,246,0.28)] hover:bg-[#4F27E8] hover:shadow-[0_6px_20px_rgba(102,60,246,0.38)]",
        gradient:
          "bg-gradient-to-r from-[#7C3AED] via-[#663CF6] to-[#4F27E8] text-white shadow-[0_4px_16px_rgba(102,60,246,0.3)] hover:from-[#6D28D9] hover:to-[#3730A3] hover:shadow-[0_6px_22px_rgba(102,60,246,0.42)]",
        secondary:
          "border-[1.5px] border-[#7C3AED] bg-white text-[#4F27E8] font-bold shadow-sm hover:border-[#4F27E8] hover:bg-[#F7F4FF]",
        outline:
          "border border-[#CAD0EB] bg-white text-[#1B1D45] shadow-sm hover:border-[#663CF6] hover:bg-[#F7F6FE] hover:text-[#663CF6]",
        ghost: "text-[#1B1D45] hover:bg-[#F0EBFE] hover:text-[#663CF6]",
        destructive:
          "bg-[#DC2626] text-white shadow-sm hover:bg-[#B91C1C] focus-visible:ring-red-400",
        link: "text-[#663CF6] underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 rounded-[10px] px-3 text-xs",
        lg: "h-12 rounded-[14px] px-8 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
