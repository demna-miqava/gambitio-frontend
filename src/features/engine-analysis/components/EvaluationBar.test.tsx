import { describe, expect, test } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { EvaluationBarView } from "./EvaluationBar";

const bar = (props: Partial<Parameters<typeof EvaluationBarView>[0]>) =>
  renderToStaticMarkup(
    <EvaluationBarView whitePercent={70} label="1.2" spokenLabel="Evaluation +1.2" {...props} />
  );

describe("EvaluationBarView", () => {
  test("white fills from the bottom by default, with its lead labelled there", () => {
    const html = bar({});
    expect(html).toContain("origin-bottom");
    expect(html).toContain("bottom-0");
  });

  test("turns with a flipped board: white fills from the top", () => {
    const html = bar({ bottom: "black" });
    expect(html).toContain("origin-top");
    expect(html).toContain("top-0");
    expect(html).not.toContain("bottom-0");
  });

  test("black's lead is labelled at the bottom when black is at the bottom", () => {
    const html = bar({ bottom: "black", whitePercent: 30 });
    expect(html).toContain("bottom-0");
  });
});
