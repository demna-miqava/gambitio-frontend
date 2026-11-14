import { SegmentedRadioGroup, type SegmentedOption } from "@/components/SegmentedRadioGroup";
import { useQueryParams } from "@/hooks/useQueryParams";

const OPTIONS: SegmentedOption<string>[] = [
  { value: "all", label: "All" },
  { value: "bullet", label: "Bullet" },
  { value: "blitz", label: "Blitz" },
  { value: "rapid", label: "Rapid" },
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
