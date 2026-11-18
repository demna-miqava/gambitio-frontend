import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import AuthGuard from "./AuthGuard";

const user = { isPending: false, isAuthenticated: false, hasProfile: false, isError: false, refetch: () => {} };
vi.mock("@/hooks/useUser", () => ({ useUser: () => user }));

/**
 * Whether the guard shows the page at `path`. When it redirects instead it
 * renders a <Navigate>, which is nothing in a static render.
 */
const shows = (path: string) =>
  renderToStaticMarkup(
    <MemoryRouter initialEntries={[path]}>
      <AuthGuard>
        <p>the page</p>
      </AuthGuard>
    </MemoryRouter>
  ).includes("the page");

const SHARED = "/share/aB3dE6gH9jK2mN";

describe("AuthGuard", () => {
  beforeEach(() => {
    Object.assign(user, { isPending: false, isAuthenticated: false, hasProfile: false, isError: false });
  });

  it("shows a shared game to someone who isn't signed in", () => {
    expect(shows(SHARED)).toBe(true);
  });

  it("keeps a signed-in user on a shared game instead of sending them home", () => {
    Object.assign(user, { isAuthenticated: true, hasProfile: true });
    expect(shows(SHARED)).toBe(true);
    // Unlike the sign-in pages, which a signed-in user is sent away from
    expect(shows("/signin")).toBe(false);
    expect(shows("/")).toBe(false);
  });

  it("sends someone who signed up from a shared game to profile setup first", () => {
    Object.assign(user, { isAuthenticated: true, hasProfile: false });
    expect(shows(SHARED)).toBe(false);
    expect(shows("/profile-setup")).toBe(true);
  });

  it("still asks for sign-in everywhere else", () => {
    expect(shows("/archive/12")).toBe(false);
    expect(shows("/home")).toBe(false);
    // Only the share page itself is open, not paths around it
    expect(shows("/share")).toBe(false);
    expect(shows(`${SHARED}/extra`)).toBe(false);
    expect(shows("/")).toBe(true);
    expect(shows("/signin")).toBe(true);
  });
});
