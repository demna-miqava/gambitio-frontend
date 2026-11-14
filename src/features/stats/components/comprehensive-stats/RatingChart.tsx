import { useEffect, useState, type KeyboardEvent, type PointerEvent } from "react";
import { type RatingDataPoint } from "../../hooks/useGetComprehensiveStats";

const HEIGHT = 220;
// Room inside the plot so the line and end dot never touch the edges
const PAD_Y = 12;
const PAD_X = 6;
const Y_AXIS_WIDTH = 44;

/** Rounds the axis to tidy steps (e.g. 1180–1260 in 20s) around the data. */
const niceRange = (min: number, max: number) => {
  const span = Math.max(max - min, 20);
  const step = span <= 60 ? 10 : span <= 150 ? 25 : span <= 400 ? 50 : 100;
  const lo = Math.floor((min - step / 2) / step) * step;
  const hi = Math.ceil((max + step / 2) / step) * step;
  return { lo, hi, ticks: [lo, Math.round((lo + hi) / 2), hi] };
};

/**
 * Plot width, kept in sync with the container so the line is never stretched.
 * A callback ref, because the plot only mounts once there's data.
 */
const useWidth = () => {
  const [element, setElement] = useState<HTMLDivElement | null>(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    observer.observe(element);
    return () => observer.disconnect();
  }, [element]);
  return [setElement, width] as const;
};

/**
 * Rating over the selected period: a 2px line over a faint wash, hairline
 * grid, and a crosshair that snaps to the nearest day with its rating. Arrow
 * keys move the crosshair; screen readers get a table.
 */
const RatingChart = ({ ratingHistory }: { ratingHistory: RatingDataPoint[] }) => {
  const [plotRef, width] = useWidth();
  const [active, setActive] = useState<number | null>(null);

  if (ratingHistory.length === 0) {
    return (
      <section className="rounded-2xl bg-card p-5 sm:p-6">
        <h3 className="text-lg font-display text-foreground">Rating progress</h3>
        <p className="flex h-40 items-center justify-center text-sm text-muted-foreground">
          No rated games in this period yet.
        </p>
      </section>
    );
  }

  // One point is drawn as a flat line across the chart
  const series = ratingHistory.length === 1 ? [ratingHistory[0], ratingHistory[0]] : ratingHistory;
  const ratings = series.map((d) => d.rating);
  const { lo, hi, ticks } = niceRange(Math.min(...ratings), Math.max(...ratings));
  const innerW = Math.max(width - PAD_X * 2, 1);
  const x = (i: number) => PAD_X + (i / (series.length - 1)) * innerW;
  const y = (rating: number) => PAD_Y + (1 - (rating - lo) / (hi - lo)) * (HEIGHT - PAD_Y * 2);

  const line = series.map((d, i) => `${i ? "L" : "M"}${x(i)},${y(d.rating)}`).join(" ");
  const area = `${line} L${x(series.length - 1)},${HEIGHT} L${x(0)},${HEIGHT} Z`;
  const last = series.length - 1;
  const first = ratingHistory[0];
  const final = ratingHistory[ratingHistory.length - 1];

  const nearest = (clientX: number, rect: DOMRect) =>
    Math.round(((clientX - rect.left - PAD_X) / innerW) * last);
  const onPointerMove = (event: PointerEvent<SVGSVGElement>) => {
    const index = nearest(event.clientX, event.currentTarget.getBoundingClientRect());
    setActive(Math.min(last, Math.max(0, index)));
  };
  const onKeyDown = (event: KeyboardEvent<SVGSVGElement>) => {
    const moves: Record<string, number> = {
      ArrowLeft: (active ?? last + 1) - 1,
      ArrowRight: (active ?? -1) + 1,
      Home: 0,
      End: last,
    };
    if (!(event.key in moves)) return;
    event.preventDefault();
    setActive(Math.min(last, Math.max(0, moves[event.key])));
  };

  const point = active !== null ? series[active] : null;
  const tooltipLeft = active !== null ? Math.min(Math.max(x(active), 60), width - 60) : 0;

  return (
    <section className="rounded-2xl bg-card p-5 sm:p-6">
      <div className="mb-4 flex items-baseline justify-between gap-4">
        <h3 className="text-lg font-display text-foreground">Rating progress</h3>
        <p className="text-sm tabular-nums text-muted-foreground">
          {first.rating} → <span className="font-medium text-foreground">{final.rating}</span>
        </p>
      </div>

      <div className="flex gap-2">
        {/* Y axis */}
        <div
          className="relative shrink-0 text-right text-xs tabular-nums text-muted-foreground"
          style={{ width: Y_AXIS_WIDTH, height: HEIGHT }}
          aria-hidden="true"
        >
          {ticks.map((tick) => (
            <span
              key={tick}
              className="absolute right-0 -translate-y-1/2"
              style={{ top: y(tick) }}
            >
              {tick}
            </span>
          ))}
        </div>

        <div className="min-w-0 flex-1">
          <div ref={plotRef} className="relative" style={{ height: HEIGHT }}>
            {width > 0 && (
              <svg
                width={width}
                height={HEIGHT}
                className="block touch-pan-y text-primary outline-none focus-visible:rounded-md focus-visible:ring-2 focus-visible:ring-ring"
                role="img"
                aria-label={`Rating went from ${first.rating} on ${first.date} to ${final.rating} on ${final.date}. Use the arrow keys to read each day.`}
                tabIndex={0}
                onPointerMove={onPointerMove}
                onPointerDown={onPointerMove}
                onPointerLeave={() => setActive(null)}
                onKeyDown={onKeyDown}
                onBlur={() => setActive(null)}
              >
                {ticks.map((tick) => (
                  <line
                    key={tick}
                    x1={0}
                    x2={width}
                    y1={y(tick)}
                    y2={y(tick)}
                    className="stroke-border"
                    strokeWidth={1}
                    shapeRendering="crispEdges"
                  />
                ))}
                <path d={area} fill="currentColor" fillOpacity={0.1} />
                <path
                  d={line}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
                {/* Today's rating */}
                <circle
                  cx={x(last)}
                  cy={y(series[last].rating)}
                  r={4}
                  fill="currentColor"
                  className="stroke-card"
                  strokeWidth={2}
                />
                {active !== null && point && (
                  <g aria-hidden="true">
                    <line
                      x1={x(active)}
                      x2={x(active)}
                      y1={0}
                      y2={HEIGHT}
                      className="stroke-muted-foreground/40"
                      strokeWidth={1}
                      shapeRendering="crispEdges"
                    />
                    <circle
                      cx={x(active)}
                      cy={y(point.rating)}
                      r={5}
                      fill="currentColor"
                      className="stroke-card"
                      strokeWidth={2}
                    />
                  </g>
                )}
              </svg>
            )}

            {point && (
              <div
                aria-live="polite"
                className="pointer-events-none absolute top-0 z-10 -translate-x-1/2 rounded-lg border border-border bg-popover px-2.5 py-1.5 text-center shadow-md"
                style={{ left: tooltipLeft }}
              >
                <p className="text-sm font-medium tabular-nums text-popover-foreground">
                  {point.rating}
                </p>
                <p className="text-xs text-muted-foreground">{point.date}</p>
              </div>
            )}
          </div>

          {/* X axis: first and last day only, so labels never collide */}
          <div className="mt-2 flex justify-between text-xs text-muted-foreground" aria-hidden="true">
            <span>{first.date}</span>
            {ratingHistory.length > 1 && <span>{final.date}</span>}
          </div>
        </div>
      </div>

      <table className="sr-only">
        <caption>Rating by day</caption>
        <thead>
          <tr>
            <th scope="col">Date</th>
            <th scope="col">Rating</th>
          </tr>
        </thead>
        <tbody>
          {ratingHistory.map((d, i) => (
            <tr key={`${d.date}-${i}`}>
              <td>{d.date}</td>
              <td>{d.rating}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
};

export default RatingChart;
