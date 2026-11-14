import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useDeleteAccount } from "../hooks/useDeleteAccount";

export const DeleteAccountSection = () => {
  const [open, setOpen] = useState(false);
  const { deleteAccount, isLoading } = useDeleteAccount();

  const handleDelete = () => {
    deleteAccount();
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="mb-1 text-lg font-display">Delete account</h3>
        <p className="text-sm text-muted-foreground">
          Permanently delete your account, profile, friends and settings. This
          action cannot be undone.
        </p>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className="border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive">
            Delete account
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete your account?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. Your account, profile, friends and
              settings will be deleted. Games you played stay in your
              opponents' history without your name.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isLoading}
            >
              {isLoading ? "Deleting…" : "Delete account"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
