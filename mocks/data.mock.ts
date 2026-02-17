// Chart data for activity
export const mockActivityData = [
  { date: "Jan 15", prs: 2, reviews: 3 },
  { date: "Jan 16", prs: 1, reviews: 2 },
  { date: "Jan 17", prs: 3, reviews: 4 },
  { date: "Jan 18", prs: 2, reviews: 1 },
  { date: "Jan 19", prs: 4, reviews: 5 },
  { date: "Jan 20", prs: 1, reviews: 2 },
  { date: "Jan 21", prs: 3, reviews: 3 },
];

export const codeChurnData = [
  { day: "Mon", additions: 320, deletions: 110, changedFiles: 8 },
  { day: "Tue", additions: 540, deletions: 230, changedFiles: 14 },
  { day: "Wed", additions: 180, deletions: 90, changedFiles: 5 },
  { day: "Thu", additions: 760, deletions: 310, changedFiles: 21 },
  { day: "Fri", additions: 430, deletions: 180, changedFiles: 12 },
  { day: "Sat", additions: 120, deletions: 40, changedFiles: 3 },
  { day: "Sun", additions: 60, deletions: 20, changedFiles: 2 },
];

export const issueStatusDist = [
  { name: "Open", value: 38, color: "#3b82f6" },
  { name: "Closed", value: 62, color: "#22c55e" },
];

export const mergedTimeline = [
  { week: "Week 1", merged: 6 },
  { week: "Week 2", merged: 10 },
  { week: "Week 3", merged: 7 },
  { week: "Week 4", merged: 13 },
];

export const repoActivity = [
  { repo: "main-app", prs: 18, issues: 11, merged: 14 },
  { repo: "frontend", prs: 12, issues: 7, merged: 9 },
  { repo: "backend", prs: 15, issues: 9, merged: 11 },
  { repo: "mobile", prs: 8, issues: 5, merged: 5 },
  { repo: "infra", prs: 5, issues: 2, merged: 4 },
];
