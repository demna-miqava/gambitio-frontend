import { Link } from "react-router-dom";
import { ArrowRight, BarChart3, Microscope, Puzzle, Swords } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BrandLogo } from "@/components/Brand";
import { DecorativeBoard } from "@/components/DecorativeBoard";
import { ROUTES } from "@/constants/routes";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

const FEATURES = [
  {
    icon: Swords,
    title: "Play online",
    text: "Get paired in seconds at bullet, blitz or rapid, or challenge a friend.",
  },
  {
    icon: Puzzle,
    title: "Solve puzzles",
    text: "Train tactics at your own pace, race the clock, or survive on three lives.",
  },
  {
    icon: Microscope,
    title: "Analyze games",
    text: "Review every game with Stockfish, right in your browser.",
  },
  {
    icon: BarChart3,
    title: "Track progress",
    text: "Ratings, results and trends for every time control.",
  },
];

const IntroPage = () => {
  useDocumentTitle("Play chess online");

  return (
    <div className="relative min-h-svh overflow-hidden">

      <header className="relative mx-auto flex max-w-6xl items-center justify-between px-5 py-5 sm:px-8">
        <BrandLogo />
        <nav className="flex items-center gap-2">
          <Button variant="ghost" asChild>
            <Link to={ROUTES.AUTH.SIGN_IN}>Sign in</Link>
          </Button>
          <Button asChild className="hidden sm:inline-flex">
            <Link to={ROUTES.AUTH.SIGN_UP}>Get started</Link>
          </Button>
        </nav>
      </header>

      <main className="relative mx-auto max-w-6xl px-5 sm:px-8">
        <section className="grid items-center gap-12 py-10 sm:py-16 lg:grid-cols-[1.1fr_1fr] lg:gap-16 lg:py-20">
          <div className="space-y-7">
            <p className="flex items-center gap-3 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
              <span className="h-px w-8 bg-gold" aria-hidden="true" />
              Free to play · No ads
            </p>
            <h1 className="font-display text-[2.6rem] leading-[1.05] font-medium text-foreground sm:text-6xl">
              Play better chess,
              <br />
              <em className="font-normal text-primary">one move at a time.</em>
            </h1>
            <p className="max-w-lg text-base text-muted-foreground sm:text-lg">
              Gambitio brings live games, puzzles and engine analysis together
              in one calm, focused place.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button asChild size="xl">
                <Link to={ROUTES.AUTH.SIGN_UP}>
                  Create a free account <ArrowRight />
                </Link>
              </Button>
              <Button asChild size="xl" variant="outline">
                <Link to={ROUTES.AUTH.SIGN_IN}>I already have an account</Link>
              </Button>
            </div>
          </div>

          <div className="mx-auto w-full max-w-md lg:max-w-none">
            <DecorativeBoard />
          </div>
        </section>

        <section
          aria-label="What you can do"
          className="grid gap-x-8 gap-y-10 border-t border-border py-14 sm:grid-cols-2 lg:grid-cols-4"
        >
          {FEATURES.map(({ icon: Icon, title, text }) => (
            <div key={title}>
              <Icon className="mb-4 size-5 text-gold" strokeWidth={1.5} aria-hidden="true" />
              <h2 className="font-display text-lg font-medium text-foreground">{title}</h2>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{text}</p>
            </div>
          ))}
        </section>
      </main>

      <footer className="relative mx-auto max-w-6xl px-5 pb-8 text-xs text-muted-foreground sm:px-8">
        © {new Date().getFullYear()} Gambitio
      </footer>
    </div>
  );
};

export default IntroPage;
