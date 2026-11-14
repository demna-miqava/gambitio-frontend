import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

type Option = {
  value: string;
  label: string;
};

type SettingRadioGroupProps = {
  id: string;
  label: string;
  description: string;
  options: Option[];
  value: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
};

/** A setting with a few named choices. Saved on change, like SettingSwitch. */
export const SettingRadioGroup = ({
  id,
  label,
  description,
  options,
  value,
  onValueChange,
  disabled,
}: SettingRadioGroupProps) => (
  <div className="space-y-4 border-b border-border py-4 first:pt-0 last:border-0 last:pb-0">
    <div className="space-y-0.5">
      <p id={`${id}-label`} className="text-sm font-medium leading-none">
        {label}
      </p>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
    <RadioGroup
      aria-labelledby={`${id}-label`}
      value={value}
      onValueChange={onValueChange}
      disabled={disabled}
      className="gap-3"
    >
      {options.map((option) => (
        <div key={option.value} className="flex items-center gap-2">
          <RadioGroupItem value={option.value} id={`${id}-${option.value}`} />
          <Label htmlFor={`${id}-${option.value}`} className="cursor-pointer font-normal">
            {option.label}
          </Label>
        </div>
      ))}
    </RadioGroup>
  </div>
);
