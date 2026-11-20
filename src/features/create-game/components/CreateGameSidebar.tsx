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

const otherWayLink =
  "relative touch-target underline-offset-4 transition-colors hover:text-foreground hover:underline";

/**
 * The ways to play that aren't against another player online: one quiet
 * line, so they don't crowd the opponent picker above. Both are in the
 * sidebar's Play menu too.
 */
const OtherWaysToPlay = () => (
  <nav
    aria-label="Other ways to play"
    className="flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-border pt-4 text-sm text-muted-foreground"
  >
    <span>Also:</span>
    <Link to={ROUTES.PLAY_BOTS} className={otherWayLink}>
      Play the computer
    </Link>
    <Link to={ROUTES.TABLE} className={otherWayLink}>
      Table mode
    </Link>
  </nav>
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

      {!isSearching && <OtherWaysToPlay />}
    </aside>
  );
};
