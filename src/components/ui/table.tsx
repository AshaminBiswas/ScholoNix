import * as React from "react";
import { cn } from "@/lib/utils/cn";

const Table = React.forwardRef<HTMLTableElement, React.HTMLAttributes<HTMLTableElement>>(
  ({ className, ...props }, ref) => (
    <div className="relative w-full overflow-auto rounded-[16px] border border-[#D6DBF0] bg-white shadow-[0_8px_24px_rgba(24,18,77,0.08)] dark:border-[#272B4D] dark:bg-[#141731] dark:shadow-[0_10px_28px_rgba(3,5,18,0.45)]">
      <table
        ref={ref}
        className={cn("w-full caption-bottom text-sm text-[#1B1D45] dark:text-[#DCE1F9]", className)}
        {...props}
      />
    </div>
  ),
);
Table.displayName = "Table";

const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <thead
    ref={ref}
    className={cn(
      "border-b border-[#D6DBF0] bg-[#F1EDFE] text-[#08093B] font-bold dark:border-[#272B4D] dark:bg-[#1B1F3F] dark:text-[#F3F5FF]",
      className,
    )}
    {...props}
  />
));
TableHeader.displayName = "TableHeader";

const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody
    ref={ref}
    className={cn("[&_tr:last-child]:border-0 bg-white dark:bg-[#141731]", className)}
    {...props}
  />
));
TableBody.displayName = "TableBody";

const TableFooter = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tfoot
    ref={ref}
    className={cn(
      "border-t border-[#D6DBF0] bg-[#F5F7FD] font-semibold text-[#08093B] dark:border-[#272B4D] dark:bg-[#11152C] dark:text-[#F3F5FF]",
      className,
    )}
    {...props}
  />
));
TableFooter.displayName = "TableFooter";

const TableRow = React.forwardRef<
  HTMLTableRowElement,
  React.HTMLAttributes<HTMLTableRowElement>
>(({ className, ...props }, ref) => (
  <tr
    ref={ref}
    className={cn(
      "border-b border-[#DFE3F5] transition-colors hover:bg-[#F8F6FF] data-[state=selected]:bg-[#EDE7FF] dark:border-[#232746] dark:hover:bg-[#1B2042] dark:data-[state=selected]:bg-[#251E54]",
      className,
    )}
    {...props}
  />
));
TableRow.displayName = "TableRow";

const TableHead = React.forwardRef<
  HTMLTableCellElement,
  React.ThHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <th
    ref={ref}
    className={cn(
      "h-11 px-4 text-left align-middle font-bold text-[#08093B] dark:text-[#F3F5FF] [&:has([role=checkbox])]:pr-0",
      className,
    )}
    {...props}
  />
));
TableHead.displayName = "TableHead";

const TableCell = React.forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <td
    ref={ref}
    className={cn(
      "p-4 align-middle text-[#1B1D45] dark:text-[#DCE1F9] [&:has([role=checkbox])]:pr-0",
      className,
    )}
    {...props}
  />
));
TableCell.displayName = "TableCell";

const TableCaption = React.forwardRef<
  HTMLTableCaptionElement,
  React.HTMLAttributes<HTMLTableCaptionElement>
>(({ className, ...props }, ref) => (
  <caption
    ref={ref}
    className={cn("mt-4 text-xs font-medium text-[#4D5072] dark:text-[#9DA6CC]", className)}
    {...props}
  />
));
TableCaption.displayName = "TableCaption";

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
};
