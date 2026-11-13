import { formatThemeLabel } from "../../utils/themeLabels";

interface PuzzleThemesProps {
  themes?: string[];
}

export const PuzzleThemes = ({ themes }: PuzzleThemesProps) => {
  if (!themes?.length) return null;

  return (
    <div className="flex flex-wrap gap-1.5">
      {themes.map((theme) => (
        <span
          key={theme}
          className="rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground"
        >
          {formatThemeLabel(theme)}
        </span>
      ))}
    </div>
  );
};
