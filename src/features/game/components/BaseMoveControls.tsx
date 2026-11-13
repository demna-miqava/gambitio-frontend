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
      <nav className="flex w-full gap-1.5" aria-label="Move navigation">
        {controls.map((control) => (
          <Button
            key={control.id}
            type="button"
            variant="secondary"
            className={cn(
              "h-11 flex-1 rounded-lg sm:h-10",
              "disabled:cursor-not-allowed disabled:opacity-40"
            )}
            title={control.title}
            aria-label={control.title}
            onClick={control.onClick}
            disabled={control.disabled}
          >
            <control.icon className="size-5" aria-hidden="true" />
          </Button>
        ))}
      </nav>
      {additionalActions}
    </div>
  );
};
