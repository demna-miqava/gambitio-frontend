import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { BrandLogo } from "@/components/Brand";
import { DecorativeBoard } from "@/components/DecorativeBoard";
import { ROUTES } from "@/constants/routes";

/** Split screen for sign in / sign up: form on one side, brand on the other. */
export const AuthLayout = ({ children }: { children: ReactNode }) => (
  <div className="grid min-h-svh lg:grid-cols-2">
    <div className="flex flex-col px-5 py-6 sm:px-10">
      <Link to={ROUTES.LANDING} aria-label="Gambitio home" className="w-fit">
        <BrandLogo />
      </Link>
      <div className="flex flex-1 items-center justify-center py-10">{children}</div>
    </div>

    <aside className="relative hidden overflow-hidden border-l border-border/70 bg-sidebar lg:flex lg:flex-col lg:items-center lg:justify-center lg:gap-10 lg:p-12">
      <DecorativeBoard className="relative max-w-md" />
      <blockquote className="relative max-w-md text-center">
        <p className="font-display text-2xl leading-snug italic text-foreground">
          “Every chess master was once a beginner.”
        </p>
        <footer className="mt-2 text-sm text-muted-foreground">Irving Chernev</footer>
      </blockquote>
    </aside>
  </div>
);
