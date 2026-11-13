import { CalendarDays } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQueryParams } from "@/hooks/useQueryParams";

const OPTIONS = [
  { label: "All time", value: "all-time" },
  { label: "Last 30 days", value: "30" },
  { label: "Last 90 days", value: "90" },
  { label: "Last year", value: "365" },
];

/** The period the stats cover; kept in the URL (?days=). */
const StatsDaysSelect = () => {
  const [days, setDays] = useQueryParams("days", "all-time");
  const value = OPTIONS.some((o) => o.value === days) ? days : "all-time";

  return (
    <Select
      value={value}
      onValueChange={(next) => setDays(next === "all-time" ? undefined : next)}
    >
      <SelectTrigger aria-label="Period" className="w-full justify-start gap-2 bg-card data-[size=default]:h-12 sm:w-44 [&>svg:last-child]:ml-auto">
        <CalendarDays className="size-4 text-muted-foreground" aria-hidden="true" />
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {OPTIONS.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default StatsDaysSelect;
