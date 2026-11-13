import ComprehensiveStats from "@/features/stats/components/comprehensive-stats/ComprehensiveStats";
import PerformanceShowcase from "@/features/stats/components/performance/PerformanceShowcase";
import StatsDaysSelect from "@/features/stats/components/StatsDaysSelect";
import StatsVariantPicker from "@/features/stats/components/StatsVariantPicker";
import { useQueryParams } from "@/hooks/useQueryParams";

/**
 * Filters in one row at the top (time control, period), then the rating,
 * its chart and the results for that selection. "All" also shows each time
 * control's current rating first.
 */
const ProfileStats = () => {
  const [variant] = useQueryParams("variant", "all");

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <StatsVariantPicker />
        <StatsDaysSelect />
      </div>
      {variant === "all" && <PerformanceShowcase />}
      <ComprehensiveStats />
    </div>
  );
};

export default ProfileStats;
