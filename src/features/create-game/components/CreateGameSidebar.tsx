import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

import { New } from "./sections/New";
import { Friends } from "./sections/Friends";
import { Bot } from "./sections/Bot";
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
  bot: "Play a bot",
  custom: "Custom time",
  "friend-invite-options": "Send a challenge",
};

/** Who to play: a stranger, a friend, or the computer, all set up on this page */
const MODES: { section: "new" | "friends" | "bot"; label: string }[] = [
  { section: "new", label: "Online" },
  { section: "friends", label: "A friend" },
  { section: "bot", label: "A bot" },
];

const TableModeLink = () => (
  <Link
    to={ROUTES.TABLE}
    className="rounded-xl bg-background p-3.5 text-sm transition-colors hover:bg-accent"
  >
    <span className="block font-medium">Table mode</span>
    <span className="block text-xs text-muted-foreground">A clock and recorder for a real board</span>
  </Link>
);

export const CreateGameSidebar = () => {
  const { activeSection, setActiveSection, canGoBack, goBack, isSearching } =
    useGameSetup();
  const isTopLevel = MODES.some(({ section }) => section === activeSection);
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
        description="Find an opponent online, challenge a friend or play the computer."
      />

      <Tabs
        value={activeSection}
        onValueChange={(value) => setActiveSection(value as GameSection)}
        className="gap-5"
      >
        {/* Switching while searching would stop the search */}
        {!isSearching && (
          <TabsList aria-label="Opponent" className="grid h-11 w-full grid-cols-3">
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
        <TabsContent value="bot">
          <Bot />
        </TabsContent>
      </Tabs>

      {!isSearching && <TableModeLink />}
    </aside>
  );
};
