import * as RadioGroupPrimitive from "@radix-ui/react-radio-group";
import { cn } from "@/lib/utils";

interface PillRadioGroupProps<T extends string> {
  value: T;
  onValueChange: (value: T) => void;
  options: readonly { value: T; label: string }[];
  /** Accessible name of the group */
  label: string;
  disabled?: boolean;
  className?: string;
}

/**
 * A small either/or switch (Rated or Casual): the options side by side in
 * a sunken track, the picked one raised. One Tab stop; arrow keys move the
 * selection. For a setting beside a heading, where SegmentedRadioGroup's
 * underlined row would read as tabs.
 */
export function PillRadioGroup<T extends string>({
  value,
  onValueChange,
  options,
  label,
  disabled,
  className,
}: PillRadioGroupProps<T>) {
  return (
    <RadioGroupPrimitive.Root
      value={value}
      onValueChange={(next) => onValueChange(next as T)}
      aria-label={label}
      disabled={disabled}
      orientation="horizontal"
      className={cn(
        "inline-grid auto-cols-fr grid-flow-col gap-0.5 rounded-md bg-muted p-[3px] shadow-[inset_0_0_0_1px_var(--border)]",
        className
      )}
    >
      {options.map((option) => (
        <RadioGroupPrimitive.Item
          key={option.value}
          value={option.value}
          className={cn(
            "inline-flex min-h-[30px] items-center justify-center rounded-[4px] px-3 text-[13px] font-semibold whitespace-nowrap text-muted-foreground transition-colors max-sm:min-h-9",
            "outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring",
            "data-[state=checked]:bg-card data-[state=checked]:text-foreground data-[state=checked]:shadow-[0_0_0_1px_var(--border),0_1px_2px_rgb(0_0_0/0.08)]",
            "disabled:pointer-events-none disabled:opacity-50"
          )}
        >
          {option.label}
        </RadioGroupPrimitive.Item>
      ))}
    </RadioGroupPrimitive.Root>
  );
}
