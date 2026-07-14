import { describe, expect, it } from "vitest";
import {
  buildCreditStatus,
  nextSingaporeReset,
  singaporeCreditDate,
} from "@/lib/credits";

describe("daily analysis credits", () => {
  it("uses the Asia/Singapore calendar date", () => {
    expect(singaporeCreditDate(new Date("2026-07-14T15:59:59.000Z"))).toBe(
      "2026-07-14",
    );
    expect(singaporeCreditDate(new Date("2026-07-14T16:00:00.000Z"))).toBe(
      "2026-07-15",
    );
  });

  it("returns the next Singapore midnight", () => {
    expect(
      nextSingaporeReset(new Date("2026-07-14T15:30:00.000Z")).toISOString(),
    ).toBe("2026-07-14T16:00:00.000Z");
  });

  it("clamps the remaining balance safely", () => {
    expect(buildCreditStatus(2, 3).remaining).toBe(1);
    expect(buildCreditStatus(8, 3).remaining).toBe(0);
    expect(buildCreditStatus(-2, 3).remaining).toBe(3);
  });
});
