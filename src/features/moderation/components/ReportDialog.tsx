import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useBlockUser, useIsBlocked, useReportUser } from "../hooks/useBlocks";
import { REPORT_DETAILS_MAX_LENGTH, REPORT_REASONS, type ReportReason } from "../types";

interface ReportDialogProps {
  player: { id: number; username: string };
  /** The game the two are playing or played, so its chat goes with the report */
  gameId?: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Reports a player to the moderators: a reason, optional details, and the
 * choice to block them as well. Mounted only while open, so it always
 * starts empty.
 */
const ReportForm = ({ player, gameId, onOpenChange }: Omit<ReportDialogProps, "open">) => {
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [details, setDetails] = useState("");
  const [alsoBlock, setAlsoBlock] = useState(false);
  const isBlocked = useIsBlocked(player.id);
  const report = useReportUser();
  const block = useBlockUser();
  const trimmed = details.trim();
  // "Something else" says nothing on its own
  const needsDetails = reason === "other" && trimmed.length === 0;
  const canSend = reason !== null && !needsDetails && !report.isPending;

  const send = () => {
    if (!reason || !canSend) return;
    report.mutate(
      {
        reportedId: player.id,
        reason,
        ...(trimmed && { details: trimmed }),
        ...(gameId !== undefined && { gameId }),
      },
      {
        onSuccess: () => {
          if (alsoBlock && !isBlocked) block.mutate(player);
          onOpenChange(false);
        },
      }
    );
  };

  return (
    <form
      className="space-y-5"
      onSubmit={(event) => {
        event.preventDefault();
        send();
      }}
    >
      <DialogHeader>
        <DialogTitle>Report {player.username}</DialogTitle>
        <DialogDescription>
          Reports go to the moderators. {player.username} isn't told who reported them.
        </DialogDescription>
      </DialogHeader>

      <RadioGroup
        aria-label="What happened"
        value={reason ?? ""}
        onValueChange={(value) => setReason(value as ReportReason)}
        className="gap-1"
      >
        {REPORT_REASONS.map((option) => (
          <Label
            key={option.value}
            htmlFor={`report-reason-${option.value}`}
            className="flex cursor-pointer items-start gap-3 rounded-lg px-2 py-2 font-normal hover:bg-muted/60"
          >
            <RadioGroupItem
              value={option.value}
              id={`report-reason-${option.value}`}
              className="mt-0.5"
            />
            <span className="space-y-0.5 leading-tight">
              <span className="block text-sm font-medium text-foreground">{option.label}</span>
              <span className="block text-xs text-muted-foreground">{option.hint}</span>
            </span>
          </Label>
        ))}
      </RadioGroup>

      <div className="space-y-2">
        <Label htmlFor="report-details">
          Details{" "}
          <span className="font-normal text-muted-foreground">
            {reason === "other" ? "(required)" : "(optional)"}
          </span>
        </Label>
        <Textarea
          id="report-details"
          value={details}
          onChange={(event) => setDetails(event.target.value)}
          maxLength={REPORT_DETAILS_MAX_LENGTH}
          rows={3}
          placeholder="What happened, and in which game?"
          className="max-h-40"
        />
        {gameId !== undefined && (
          <p className="text-xs text-muted-foreground">
            This game and its chat are sent with the report.
          </p>
        )}
      </div>

      {!isBlocked && (
        <div className="flex items-center justify-between gap-4">
          <Label htmlFor="report-also-block" className="font-normal">
            Also block {player.username}
          </Label>
          <Switch id="report-also-block" checked={alsoBlock} onCheckedChange={setAlsoBlock} />
        </div>
      )}

      <DialogFooter className="gap-2">
        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
          Cancel
        </Button>
        <Button type="submit" disabled={!canSend}>
          Send report
        </Button>
      </DialogFooter>
    </form>
  );
};

export const ReportDialog = ({ open, onOpenChange, ...form }: ReportDialogProps) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="sm:max-w-md">
      {open && <ReportForm {...form} onOpenChange={onOpenChange} />}
    </DialogContent>
  </Dialog>
);
