export const getStartDate = (range: string) => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  switch (range) {
    case "this-week": {
      const day = today.getDay() || 7; // Monday = 1, Sunday = 7
      if (day !== 1) today.setDate(today.getDate() - (day - 1));
      return today;
    }
    case "this-month":
      return new Date(now.getFullYear(), now.getMonth(), 1);
    case "last-3-months":
      return new Date(now.getFullYear(), now.getMonth() - 3, 1);
    case "last-6-months":
      return new Date(now.getFullYear(), now.getMonth() - 6, 1);
    case "this-year":
      return new Date(now.getFullYear(), 0, 1);
    default:
      return new Date(now.getFullYear(), now.getMonth(), 1);
  }
};

export const getStartOfToday = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
};

/** Returns YYYY-MM-DD in local time without UTC day-shift issues. */
export const toLocalDateKey = (input: string | Date): string => {
  const d = new Date(input);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const formatShortMonthDay = (input: string | Date): string => {
  const d = new Date(input);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
};
