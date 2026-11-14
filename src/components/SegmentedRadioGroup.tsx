import * as RadioGroupPrimitive from "@radix-ui/react-radio-group";
import type { ComponentType } from "react";
import { cn } from "@/lib/utils";

export type SegmentedOption<T extends string> = {
  value: T;
  label: string;
  icon?: ComponentType<{ className?: string }>;
};

interface SegmentedRadioGroupProps<T extends string> {
  value: T;
  onValueChange: (value: T) => void;
  options: SegmentedOption<T>[];
  /** Accessible name of the group */
  label: string;
  disabled?: boolean;
  className?: string;
}

/**
 * A row of mutually exclusive text options over a hairline, like the tabs:
 * the picked one is in ink with an underline. One Tab stop, arrow keys move the selection.
 */
export function SegmentedRadioGroup<T extends string>({
  value,
  onValueChange,
  options,
  label,
  disabled,
  className,
}: SegmentedRadioGroupProps<T>) {
  return (
    <RadioGroupPrimitive.Root
      value={value}
      onValueChange={(v) => onValueChange(v as T)}
      aria-label={label}
      disabled={disabled}
      orientation="horizontal"
      className={cn("grid auto-cols-fr grid-flow-col gap-6 border-b border-border", className)}
    >
      {options.map((option) => (
        <RadioGroupPrimitive.Item
          key={option.value}
          value={option.value}
          className={cn(
            "relative inline-flex h-10 items-center justify-center gap-1.5 px-0.5 text-sm font-medium whitespace-nowrap text-muted-foreground transition-colors after:absolute after:inset-x-0 after:-bottom-px after:h-0.5 after:bg-transparent",
            "hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            "data-[state=checked]:text-foreground data-[state=checked]:after:bg-foreground",
            "disabled:pointer-events-none disabled:opacity-50"
          )}
        >
          {option.icon && (
            <span aria-hidden="true" className="flex">
              <option.icon className="size-4 shrink-0" />
            </span>
          )}
          {option.label}
        </RadioGroupPrimitive.Item>
      ))}
    </RadioGroupPrimitive.Root>
  );
}
