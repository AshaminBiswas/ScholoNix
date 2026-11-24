import * as React from "react";
import { cn } from "@/lib/utils/cn";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-[10px] border border-[#CAD0EB] bg-white px-3.5 py-2 text-sm text-[#1B1D45] shadow-xs transition-all duration-150 placeholder:text-[#76799C] focus:border-[#663CF6] focus:outline-none focus:ring-2 focus:ring-[#663CF6]/20 disabled:cursor-not-allowed disabled:bg-[#F5F7FD] disabled:opacity-60",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
