import * as RadioGroupPrimitive from "@radix-ui/react-radio-group";
import { cn } from "@/lib/utils";
import type { SkillOption as TSkillOption } from "../types";

type SkillOptionProps = {
  skill: TSkillOption;
};

/** One choice in the skill radio group (SkillStep); selection is announced. */
const SkillOption = ({ skill }: SkillOptionProps) => {
  const descriptionId = `skill-${skill.value}-description`;
  return (
    <RadioGroupPrimitive.Item
      value={skill.value}
      aria-describedby={descriptionId}
      className={cn(
        "group flex w-full items-center justify-between gap-4 rounded-xl border px-4 py-3.5 text-left transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        // Same selected look as the other option cards (bots, time controls)
        "border-border/70 bg-card hover:border-primary/40 hover:bg-accent/60",
        "data-[state=checked]:border-primary data-[state=checked]:bg-brand-soft data-[state=checked]:hover:bg-brand-soft"
      )}
    >
      <span className="flex flex-col">
        <span className="text-sm font-semibold text-foreground">{skill.title}</span>
        <span id={descriptionId} className="text-sm text-muted-foreground">
          {skill.description}
        </span>
        {skill.badge && (
          <span className="mt-1 text-xs font-medium text-primary">
            {skill.badge}
          </span>
        )}
      </span>
      <span
        className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-primary group-data-[state=checked]:bg-primary group-data-[state=checked]:text-primary-foreground [&_svg]:size-5"
        aria-hidden="true"
      >
        {skill.icon}
      </span>
    </RadioGroupPrimitive.Item>
  );
};
export default SkillOption;
