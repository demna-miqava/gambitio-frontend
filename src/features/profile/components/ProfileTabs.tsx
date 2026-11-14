import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLocation, useNavigate, useParams } from "react-router-dom";

const tabs = [
  { value: "overview", label: "Overview" },
  { value: "games", label: "Games" },
  { value: "stats", label: "Stats" },
  { value: "friends", label: "Friends" },
];

/** "/profile/12/stats" -> "stats"; anything else under the profile is Overview */
const getValueFromPath = (pathname: string) => {
  const segment = pathname.split("/").filter(Boolean)[2];
  return tabs.some((tab) => tab.value === segment) ? segment! : "overview";
};

export const ProfileTabs = () => {
  const location = useLocation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  return (
    <Tabs
      value={getValueFromPath(location.pathname)}
      onValueChange={(value) => {
        const routeName = value === "overview" ? "" : `${value}`;
        navigate(`/profile/${id}/${routeName}`, { state: { preserveScroll: true } });
      }}
      className="w-full"
    >
      <TabsList className="scrollbar-none flex h-auto w-full justify-start gap-6 overflow-x-auto rounded-none border-b border-border bg-transparent p-0">
        {tabs.map((tab) => (
          <TabsTrigger
            key={tab.value}
            value={tab.value}
            className="relative h-11 flex-none rounded-none border-0 bg-transparent px-0.5 text-sm font-medium text-muted-foreground shadow-none transition-colors hover:text-foreground data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none dark:data-[state=active]:bg-transparent after:absolute after:inset-x-0 after:-bottom-px after:h-0.5 after:rounded-full after:bg-primary after:opacity-0 data-[state=active]:after:opacity-100"
          >
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
};

export default ProfileTabs;
