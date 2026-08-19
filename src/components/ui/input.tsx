import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex w-full rounded-full border border-[rgba(232,213,163,0.35)] bg-[rgba(7,20,33,0.72)] px-5 py-4 text-base text-[var(--paper)] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.02)] transition-all file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-[rgba(217,210,194,0.55)] focus-visible:border-[var(--brass)] focus-visible:shadow-[0_0_0_4px_rgba(201,162,39,0.18)] focus-visible:outline-none focus-visible:-translate-y-px disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
