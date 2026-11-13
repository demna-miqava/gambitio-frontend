import type { UseFormReturn } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { AlertCircle, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import type { ProfileSetupForm } from "../hooks/useProfileSetup";

type UsernameStepProps = {
  form: UseFormReturn<ProfileSetupForm>;
  isCheckingUsername: boolean;
  isUsernameAvailable: boolean;
  showAvailabilityStatus: boolean;
  availabilityCheckFailed: boolean;
  onRetryAvailabilityCheck: () => void;
  canProceed: boolean;
  onContinue: () => void;
};

export const UsernameStep = ({
  form,
  isCheckingUsername,
  isUsernameAvailable,
  showAvailabilityStatus,
  availabilityCheckFailed,
  onRetryAvailabilityCheck,
  canProceed,
  onContinue,
}: UsernameStepProps) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (canProceed) {
      onContinue();
    } else {
      // Show why instead of a button that silently does nothing
      form.trigger("username", { shouldFocus: true });
    }
  };

  const hasUsernameError = !!form.formState.errors.username;

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit} className="space-y-8">
        <PageHeader
          className="text-center sm:justify-center"
          title="Choose your username"
          description="This is how other players will see you on Gambitio."
        />

        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input
                    placeholder="e.g. knightrider"
                    className="h-11 pr-10"
                    autoComplete="off"
                    autoFocus
                    {...field}
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {isCheckingUsername && (
                      <Loader2 className="size-5 animate-spin text-muted-foreground" aria-hidden="true" />
                    )}
                    {showAvailabilityStatus && !isCheckingUsername && isUsernameAvailable && (
                      <CheckCircle className="size-5 text-success" aria-hidden="true" />
                    )}
                    {showAvailabilityStatus && !isCheckingUsername && !isUsernameAvailable && (
                      <XCircle className="size-5 text-destructive" aria-hidden="true" />
                    )}
                    {availabilityCheckFailed && !isCheckingUsername && (
                      <AlertCircle className="size-5 text-destructive" aria-hidden="true" />
                    )}
                  </div>
                </div>
              </FormControl>
              <FormMessage />
              <div aria-live="polite">
                {!hasUsernameError && showAvailabilityStatus && !isCheckingUsername && !isUsernameAvailable && (
                  <p className="text-sm text-destructive">Username is already taken</p>
                )}
                {!hasUsernameError && showAvailabilityStatus && !isCheckingUsername && isUsernameAvailable && (
                  <p className="text-sm text-success">Username is available</p>
                )}
                {!hasUsernameError && availabilityCheckFailed && !isCheckingUsername && (
                  <p className="text-sm text-destructive">
                    Couldn't check the username,{" "}
                    <button
                      type="button"
                      onClick={onRetryAvailabilityCheck}
                      className="rounded-sm font-medium underline underline-offset-4 hover:text-destructive/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      try again
                    </button>
                  </p>
                )}
              </div>
            </FormItem>
          )}
        />

        <Button type="submit" size="xl" disabled={isCheckingUsername} className="w-full">
          {isCheckingUsername && <Loader2 className="animate-spin" aria-hidden="true" />}
          {isCheckingUsername ? "Checking…" : "Continue"}
        </Button>
      </form>
    </Form>
  );
};
