export const getStartDate = (range: string) => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  switch (range) {
    case "this-week":
      // Start of current week (assuming Monday as start)
      const day = today.getDay() || 7; // Get current day number, make Sunday 7
      if (day !== 1) today.setHours(-24 * (day - 1));
      return today;
    case "this-month":
      return new Date(now.getFullYear(), now.getMonth(), 1);
    case "last-3-months":
      return new Date(now.getFullYear(), now.getMonth() - 3, 1);
    case "last-6-months":
      return new Date(now.getFullYear(), now.getMonth() - 6, 1);
    case "this-year":
      return new Date(now.getFullYear(), 0, 1);
    default:
      // Default to "this-month"
      return new Date(now.getFullYear(), now.getMonth(), 1);
  }
};