import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

import { New } from "./sections/New";
import { Friends } from "./sections/Friends";
import { Custom } from "./sections/Custom";
import { FriendInviteOptions } from "./sections/FriendInviteOptions";
import {
  useGameSetup,
  type GameSection,
} from "@/features/create-game/GameSetupContext";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/PageHeader";
import { ROUTES } from "@/constants/routes";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

const TITLES: Record<GameSection, string> = {
  new: "Play online",
  friends: "Play a friend",
  custom: "Custom time",
  "friend-invite-options": "Send a challenge",
};

/** Same labels as the sidebar's Play links */
const MODES: { section: "new" | "friends"; label: string }[] = [
  { section: "new", label: "Play online" },
  { section: "friends", label: "Play a friend" },
];

const PlayComputerLink = () => (
  <Link
    to={ROUTES.PLAY_BOTS}
    className="rounded-xl bg-background p-3.5 text-sm transition-colors hover:bg-accent"
  >
    <span className="block font-medium">Play the computer</span>
    <span className="block text-xs text-muted-foreground">No waiting, any strength</span>
  </Link>
);

export const CreateGameSidebar = () => {
  const { activeSection, setActiveSection, canGoBack, goBack, isSearching } =
    useGameSetup();
  const isTopLevel = activeSection === "new" || activeSection === "friends";
  useDocumentTitle(TITLES[activeSection]);

  if (!isTopLevel) {
    return (
      <aside className="flex w-full flex-col gap-5 rounded-2xl bg-card p-5 sm:p-6">
        <div className="space-y-2">
          {canGoBack && (
            <Button size="lg"
              variant="ghost"
              onClick={goBack}
              className="-ml-3 text-muted-foreground"
            >
              <ArrowLeft aria-hidden="true" /> Back
            </Button>
          )}
          <PageHeader title={TITLES[activeSection]} />
        </div>
        {activeSection === "custom" ? <Custom /> : <FriendInviteOptions />}
      </aside>
    );
  }

  return (
    <aside className="flex w-full flex-col gap-5 rounded-2xl bg-card p-5 sm:p-6">
      <PageHeader
        title="Play"
        description="Find an opponent online or challenge a friend."
      />

      <Tabs
        value={activeSection}
        onValueChange={(value) => setActiveSection(value as GameSection)}
        className="gap-5"
      >
        {/* Switching while searching would stop the search */}
        {!isSearching && (
          <TabsList aria-label="Opponent" className="grid h-11 w-full grid-cols-2">
            {MODES.map(({ section, label }) => (
              <TabsTrigger key={section} value={section} className="relative touch-target">
                {label}
              </TabsTrigger>
            ))}
          </TabsList>
        )}
        <TabsContent value="new">
          <New />
        </TabsContent>
        <TabsContent value="friends">
          <Friends />
        </TabsContent>
      </Tabs>

      {!isSearching && <PlayComputerLink />}
    </aside>
  );
};
