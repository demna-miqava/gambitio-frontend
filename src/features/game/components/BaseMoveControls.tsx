import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface MoveControl {
  id: string;
  icon: LucideIcon;
  title: string;
  onClick: () => void;
  disabled: boolean;
}

interface BaseMoveControlsProps {
  controls: MoveControl[];
  additionalActions?: ReactNode;
  className?: string;
}

export const BaseMoveControls = ({
  controls,
  additionalActions,
  className,
}: BaseMoveControlsProps) => {
  return (
    <div className={className}>
      {/* Four plain icon buttons in a row: no slabs, no borders */}
      <nav className="flex w-full gap-1" aria-label="Move navigation">
        {controls.map((control) => (
          <Button
            key={control.id}
            type="button"
            variant="ghost"
            className={cn(
              "h-11 flex-1 text-foreground sm:h-9",
              "disabled:cursor-not-allowed disabled:opacity-35"
            )}
            title={control.title}
            aria-label={control.title}
            onClick={control.onClick}
            disabled={control.disabled}
          >
            <control.icon className="size-4" strokeWidth={1.75} aria-hidden="true" />
          </Button>
        ))}
      </nav>
      {additionalActions}
    </div>
  );
};
