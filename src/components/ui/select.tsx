import * as React from "react";
import { cn } from "@/lib/utils/cn";

export interface SelectOption {
  label: string;
  value: string;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options?: SelectOption[];
  placeholder?: string;
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, options, placeholder, children, ...props }, ref) => {
    return (
      <div className="relative w-full">
        <select
          ref={ref}
          className={cn(
            "flex h-10 w-full appearance-none rounded-[10px] border border-[#CAD0EB] bg-white px-3.5 py-2 pr-10 text-sm text-[#1B1D45] shadow-xs transition-all duration-150 focus:border-[#663CF6] focus:outline-none focus:ring-2 focus:ring-[#663CF6]/20 disabled:cursor-not-allowed disabled:bg-[#F5F7FD] disabled:opacity-60",
            className,
          )}
          {...props}
        >
          {placeholder && (
            <option value="" disabled className="text-[#76799C]">
              {placeholder}
            </option>
          )}
          {options
            ? options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))
            : children}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-[#4D5072]">
          <svg
            className="h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      </div>
    );
  },
);
Select.displayName = "Select";

export { Select };
