import { Button } from "@/components/ui/button";
import { GAME_BUTTON_STYLES } from "../constants/button-styles";
import { useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

type ActionButtonVariant = keyof typeof GAME_BUTTON_STYLES;

type ActionButtonProps = {
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  variant: ActionButtonVariant;
  className?: string;
  /**
   * Title for the confirmation popover.
   * If provided, onClick will require confirmation.
   */
  confirmTitle?: string;
  /** Confirm button label; defaults to the action's own label (e.g. "Resign") */
  confirmText?: string;
  disabled?: boolean;
  /** Accessible name when the visible label alone is ambiguous ("Accept" what?) */
  ariaLabel?: string;
};

export const ActionButton = ({
  onClick,
  icon,
  label,
  variant,
  className,
  confirmTitle,
  confirmText,
  disabled = false,
  ariaLabel,
}: ActionButtonProps) => {
  const [popoverOpen, setPopoverOpen] = useState(false);

  const needsConfirmation = !!confirmTitle;

  const handleConfirm = () => {
    onClick();
    setPopoverOpen(false);
  };

  const handleCancel = () => {
    setPopoverOpen(false);
  };

  const button = (
    <Button
      onClick={needsConfirmation ? undefined : onClick}
      className={className || GAME_BUTTON_STYLES[variant]}
      disabled={disabled}
      aria-label={ariaLabel}
    >
      {icon}
      {label}
    </Button>
  );

  if (!needsConfirmation) {
    return button;
  }

  return (
    <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
      <PopoverTrigger asChild>{button}</PopoverTrigger>
      <PopoverContent className="w-72" align="center">
        <div className="grid gap-4">
          <p className="text-sm font-medium">{confirmTitle}</p>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" className="h-11 sm:h-8" onClick={handleCancel}>
              Cancel
            </Button>
            <Button
              size="sm"
              className="h-11 sm:h-8"
              variant={variant === "resign" ? "destructive" : "default"}
              onClick={handleConfirm}
            >
              {confirmText ?? label}
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};
