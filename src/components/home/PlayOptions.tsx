import { Link } from "react-router-dom";
import { ArrowUpRight, Bot, Microscope, Puzzle, UsersRound } from "lucide-react";
import { ROUTES } from "@/constants/routes";

const OPTIONS = [
  {
    title: "Play a friend",
    description: "Send a challenge",
    to: ROUTES.PLAY,
    state: { section: "friends" },
    icon: UsersRound,
  },
  {
    title: "Play the computer",
    description: "Practice at your level",
    to: ROUTES.PLAY_BOTS,
    icon: Bot,
  },
  {
    title: "Puzzles",
    description: "Sharpen your tactics",
    to: ROUTES.PUZZLES,
    icon: Puzzle,
  },
  {
    title: "Analysis board",
    description: "Explore any position",
    to: ROUTES.TOOLS.ANALYSIS_BOARD,
    icon: Microscope,
  },
];

export const PlayOptions = () => (
  <nav aria-label="More ways to play" className="grid grid-cols-2 gap-2.5 lg:grid-cols-1">
    {OPTIONS.map((option) => (
      <Link
        key={option.title}
        to={option.to}
        state={option.state}
        className="group flex flex-col items-start gap-3 rounded-xl border border-border/70 bg-card p-3.5 transition-colors hover:border-primary/40 hover:bg-accent/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:flex-row sm:items-center lg:p-4"
      >
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full border border-border text-primary transition-colors group-hover:border-gold/60 group-hover:text-gold">
          <option.icon className="size-[18px]" strokeWidth={1.5} aria-hidden="true" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-medium text-foreground sm:truncate">
            {option.title}
          </span>
          <span className="block text-xs text-muted-foreground sm:truncate">
            {option.description}
          </span>
        </span>
        <ArrowUpRight
          className="hidden size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-foreground sm:block"
          aria-hidden="true"
        />
      </Link>
    ))}
  </nav>
);
