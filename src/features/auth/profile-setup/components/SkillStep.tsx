import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RadioGroup } from "@/components/ui/radio-group";
import { PageHeader } from "@/components/PageHeader";
import { type SignupSkill } from "../types";
import { SKILL_OPTIONS } from "../consts";
import SkillOption from "./SkillOption";

type SkillStepProps = {
  selectedSkill: SignupSkill | undefined;
  onSelectSkill: (value: SignupSkill) => void;
  onContinue: () => void;
  onBack: () => void;
  isLoading: boolean;
};

export const SkillStep = ({
  selectedSkill,
  onSelectSkill,
  onContinue,
  onBack,
  isLoading,
}: SkillStepProps) => {
  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="-ml-2.5 text-muted-foreground"
        >
          <ArrowLeft aria-hidden="true" /> Back
        </Button>
        <PageHeader
          className="text-center sm:justify-center"
          title="How well do you play?"
          description="It sets your starting rating, so you're paired with players near your level."
        />
      </div>

      <RadioGroup
        aria-label="Skill level"
        value={selectedSkill ?? ""}
        onValueChange={(value) => onSelectSkill(value as SignupSkill)}
        className="flex flex-col gap-3"
      >
        {SKILL_OPTIONS.map((skill) => (
          <SkillOption key={skill.value} skill={skill} />
        ))}
      </RadioGroup>

      <div className="space-y-2">
        <Button
          size="xl"
          onClick={onContinue}
          disabled={!selectedSkill || isLoading}
          className="w-full"
        >
          {isLoading && <Loader2 className="animate-spin" aria-hidden="true" />}
          {isLoading ? "Creating profile…" : "Continue"}
        </Button>
        {!selectedSkill && (
          <p className="text-center text-xs text-muted-foreground">Pick a level to continue.</p>
        )}
      </div>
    </div>
  );
};
