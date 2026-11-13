import { ChartNoAxesColumnIncreasing } from "lucide-react";
import { SegmentedRadioGroup, type SegmentedOption } from "@/components/SegmentedRadioGroup";
import { TIME_CONTROL_ICONS } from "@/constants/timeControlIcons";
import { useQueryParams } from "@/hooks/useQueryParams";

const OPTIONS: SegmentedOption<string>[] = [
  { value: "all", label: "All", icon: ChartNoAxesColumnIncreasing },
  { value: "bullet", label: "Bullet", icon: TIME_CONTROL_ICONS.bullet },
  { value: "blitz", label: "Blitz", icon: TIME_CONTROL_ICONS.blitz },
  { value: "rapid", label: "Rapid", icon: TIME_CONTROL_ICONS.rapid },
];

/** Which ratings the stats page shows; kept in the URL (?variant=). */
const StatsVariantPicker = () => {
  const [variant, setVariant] = useQueryParams("variant", "all");
  const value = OPTIONS.some((o) => o.value === variant) ? variant : "all";

  return (
    <SegmentedRadioGroup
      label="Time control"
      value={value}
      // "all" is the default, so it isn't written to the URL
      onValueChange={(next) => setVariant(next === "all" ? undefined : next)}
      options={OPTIONS}
      className="w-full sm:w-auto"
    />
  );
};

export default StatsVariantPicker;
