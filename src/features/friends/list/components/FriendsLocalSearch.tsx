import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface FriendsLocalSearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  /** Accessible name of the input */
  label?: string;
}

export const FriendsLocalSearch = ({
  value,
  onChange,
  placeholder = "Search friends…",
  label = "Search friends",
}: FriendsLocalSearchProps) => {
  return (
    <div className="relative">
      <Search
        className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden="true"
      />
      <Input
        type="search"
        aria-label={label}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-11 pl-9"
      />
    </div>
  );
};
