import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { ChatMessages } from "./ChatMessages";
import type { ChatMessage } from "../types";

const message = (id: string, userId: number, text: string): ChatMessage => ({
  id,
  userId,
  text,
  at: Date.UTC(2026, 0, 1, 12, 0),
});

const render = (messages: ChatMessage[]) =>
  renderToStaticMarkup(<ChatMessages messages={messages} viewerId={1} opponentName="bobby" />);

// An on...= attribute inside a tag. Escaped text can't match: it has no "<" of its own
const EVENT_ATTRIBUTE = /<[^>]*\son\w+\s*=/i;

describe("ChatMessages", () => {
  it("shows markup as the text that was typed, not as elements", () => {
    const html = render([
      message("1", 2, `<img src=x onerror="alert(1)">`),
      message("2", 2, `<script>alert(document.cookie)</script>`),
      message("3", 2, `<a href="javascript:alert(1)">click</a>`),
      message("4", 2, `"><svg onload=alert(1)>`),
    ]);
    // Nothing a player typed became an element or an attribute
    expect(html).not.toMatch(/<(img|script|a|svg)\b/i);
    expect(html).not.toMatch(EVENT_ATTRIBUTE);
    // It is all still there, escaped
    expect(html).toContain("&lt;img src=x onerror=&quot;alert(1)&quot;&gt;");
    expect(html).toContain("&lt;script&gt;alert(document.cookie)&lt;/script&gt;");
    expect(html).toContain("&lt;a href=&quot;javascript:alert(1)&quot;&gt;click&lt;/a&gt;");
    // Only the elements the component itself renders: one <p> and one <span> per message
    expect(html.match(/<p\b/g)).toHaveLength(4);
    expect(html.match(/<[a-z]+\b/g)).toHaveLength(8);
  });

  it("can't break out of an attribute", () => {
    // The text isn't used in any attribute; the title is a formatted time
    const html = render([message("1", 2, `" onmouseover="alert(1)`)]);
    expect(html).not.toMatch(EVENT_ATTRIBUTE);
    expect(html).toContain("&quot; onmouseover=&quot;alert(1)");
  });

  it("names who wrote each message for screen readers", () => {
    const html = render([message("1", 1, "hello"), message("2", 2, "hi")]);
    expect(html).toContain(`<span class="sr-only">You: </span>hello`);
    expect(html).toContain(`<span class="sr-only">bobby: </span>hi`);
  });

  it("puts the viewer's messages on the right and separates the speakers", () => {
    const html = render([message("1", 1, "a"), message("2", 1, "b"), message("3", 2, "c")]);
    const classes = [...html.matchAll(/<p[^>]*class="([^"]*)"/g)].map((m) => m[1]);
    expect(classes[0]).toContain("self-end");
    expect(classes[2]).toContain("self-start");
    expect(classes[1]).not.toContain("mt-1.5");
    expect(classes[2]).toContain("mt-1.5");
  });
});
