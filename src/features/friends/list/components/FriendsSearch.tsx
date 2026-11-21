import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { useDebounce } from "@/hooks/useDebounce";
import { paramsForSearch } from "@/features/friends/utils/searchParams";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

export const FriendsSearch = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const search = searchParams.get("search") ?? "";
  const [inputValue, setInputValue] = useState(search);
  const debouncedValue = useDebounce(inputValue, 500);

  // Update the URL only when the typed search settles on something new. Not
  // whenever the URL changes (turning the page, ?page=3 in a link), which
  // would otherwise send the list straight back to page 1.
  const appliedRef = useRef(debouncedValue);
  useEffect(() => {
    if (appliedRef.current === debouncedValue) return;
    appliedRef.current = debouncedValue;
    if (debouncedValue === search) return;
    setSearchParams((current) => paramsForSearch(current, debouncedValue));
  }, [debouncedValue, search, setSearchParams]);

  return (
    <div className="relative w-full sm:w-64">
      <Search
        className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden="true"
      />
      <Input
        type="search"
        aria-label="Search friends"
        placeholder="Search friends…"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        className="pl-9"
      />
    </div>
  );
};
