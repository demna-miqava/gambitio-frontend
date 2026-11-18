import { describe, expect, it } from "vitest";
import { reportContext } from "./ReportDialog";

describe("reportContext", () => {
  it("sends a game, or a study room, or nothing", () => {
    expect(reportContext({ gameId: 5 })).toEqual({ gameId: 5 });
    expect(reportContext({ studyRoomId: 9 })).toEqual({ studyRoomId: 9 });
    expect(reportContext({})).toEqual({});
  });

  it("never both: the game wins", () => {
    expect(reportContext({ gameId: 5, studyRoomId: 9 })).toEqual({ gameId: 5 });
  });
});
