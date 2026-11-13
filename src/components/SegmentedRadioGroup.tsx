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
 * A row of mutually exclusive text options on a cream track (like the tabs
 * above it). One Tab stop, arrow keys move the selection.
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
      className={cn("grid auto-cols-fr grid-flow-col rounded-lg bg-cream-soft p-1", className)}
    >
      {options.map((option) => (
        <RadioGroupPrimitive.Item
          key={option.value}
          value={option.value}
          className={cn(
            "inline-flex h-10 items-center justify-center gap-1.5 rounded-md px-2 text-sm font-medium whitespace-nowrap text-muted-foreground transition-colors",
            "hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            "data-[state=checked]:bg-background data-[state=checked]:text-foreground data-[state=checked]:shadow-sm dark:data-[state=checked]:text-cream",
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
