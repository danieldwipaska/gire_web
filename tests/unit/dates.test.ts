import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getStartDate, getStartOfToday, toLocalDateKey } from "@/lib/dates";

describe("date range & local date formatting helpers", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // Saturday, Nov 21, 2026 at 14:30 local time
    vi.setSystemTime(new Date(2026, 10, 21, 14, 30, 0));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("computes local start of today at midnight", () => {
    const today = getStartOfToday();
    expect(today.getFullYear()).toBe(2026);
    expect(today.getMonth()).toBe(10);
    expect(today.getDate()).toBe(21);
    expect(today.getHours()).toBe(0);
    expect(today.getMinutes()).toBe(0);
  });

  it("computes start of this week (Monday)", () => {
    const weekStart = getStartDate("this-week");
    // Nov 21, 2026 is Saturday -> Monday is Nov 16, 2026
    expect(toLocalDateKey(weekStart)).toBe("2026-11-16");
  });

  it("computes this-month and this-year start dates", () => {
    expect(toLocalDateKey(getStartDate("this-month"))).toBe("2026-11-01");
    expect(toLocalDateKey(getStartDate("this-year"))).toBe("2026-01-01");
  });

  it("formats local date keys without UTC day shift", () => {
    const lateNightLocal = new Date(2026, 10, 21, 23, 55, 0);
    expect(toLocalDateKey(lateNightLocal)).toBe("2026-11-21");
  });
});

