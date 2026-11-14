import { cn } from "@/lib/utils";
import type { GameReview, MoveClassification, PlayerReview } from "../types";
import { CLASSIFICATION_META } from "../classificationMeta";
import { formatAccuracy } from "../utils/formatAccuracy";

interface ReviewSummaryProps {
  review: GameReview;
  players: { white: string; black: string };
}

const COUNT_ROWS: { classification: MoveClassification; key: keyof Omit<PlayerReview, "accuracy">; label: string }[] = [
  { classification: "inaccuracy", key: "inaccuracies", label: "Inaccuracies" },
  { classification: "mistake", key: "mistakes", label: "Mistakes" },
  { classification: "blunder", key: "blunders", label: "Blunders" },
];


/** Both players' accuracy and error counts, side by side. */
export const ReviewSummary = ({ review, players }: ReviewSummaryProps) => (
  <table className="w-full table-fixed text-sm">
    <caption className="sr-only">Accuracy and errors per player</caption>
    <thead>
      <tr className="text-xs text-muted-foreground">
        <th scope="col" className="w-[44%] pb-1 text-left font-normal">
          <span className="sr-only">Statistic</span>
        </th>
        <th scope="col" className="pb-1 text-right font-medium">
          <span className="flex items-center justify-end gap-1.5">
            <span className="size-2.5 shrink-0 rounded-full border border-neutral-400 bg-neutral-100" aria-hidden="true" />
            <span className="truncate" title={players.white}>{players.white}</span>
          </span>
        </th>
        <th scope="col" className="pb-1 text-right font-medium">
          <span className="flex items-center justify-end gap-1.5">
            <span className="size-2.5 shrink-0 rounded-full border border-neutral-500 bg-neutral-800" aria-hidden="true" />
            <span className="truncate" title={players.black}>{players.black}</span>
          </span>
        </th>
      </tr>
    </thead>
    <tbody className="tabular-nums">
      <tr>
        <th scope="row" className="py-0.5 text-left font-medium">
          Accuracy
        </th>
        <td className="py-0.5 text-right text-base font-medium">{formatAccuracy(review.white.accuracy)}</td>
        <td className="py-0.5 text-right text-base font-medium">{formatAccuracy(review.black.accuracy)}</td>
      </tr>
      {COUNT_ROWS.map(({ classification, key, label }) => {
        const meta = CLASSIFICATION_META[classification];
        return (
          <tr key={key}>
            <th scope="row" className="py-0.5 text-left font-normal text-muted-foreground">
              <span className={cn("inline-block w-5 font-bold", meta.textClass)} aria-hidden="true">
                {meta.glyph}
              </span>
              {label}
            </th>
            <td className={cn("py-0.5 text-right", review.white[key] > 0 && "font-medium")}>{review.white[key]}</td>
            <td className={cn("py-0.5 text-right", review.black[key] > 0 && "font-medium")}>{review.black[key]}</td>
          </tr>
        );
      })}
    </tbody>
  </table>
);
