import { IIntegration, IIssue, IProject, IPullRequest, ProjectCategory } from "./types";

export const getTimeAgo = (date: string | Date) => {
  const now = new Date();
  const past = new Date(date);

  const diffMs = now.getTime() - past.getTime();
  const diffSeconds = Math.max(0, Math.floor(diffMs / 1000));
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) {
    return `${diffSeconds} seconds ago`;
  } else if (diffMinutes < 60) {
    return `${diffMinutes} minutes ago`;
  } else if (diffHours < 24) {
    return `${diffHours} hours ago`;
  } else {
    return `${diffDays} days ago`;
  }
};

export const isSameUser = (a?: string | null, b?: string | null): boolean => {
  return Boolean(a && b && a.toLowerCase() === b.toLowerCase());
};

export const isAnyUser = (
  target?: string | null,
  usernames: (string | null | undefined)[] = [],
): boolean => {
  if (!target) return false;
  return usernames.some((u) => isSameUser(target, u));
};

export const isIssueAssignedTo = (
  issue: IIssue,
  usernameOrList?: string | string[] | null,
): boolean => {
  if (!usernameOrList) return false;
  const usernames = Array.isArray(usernameOrList)
    ? usernameOrList
    : [usernameOrList];
  if (usernames.length === 0) return false;

  if (Array.isArray(issue.assignees) && issue.assignees.length > 0) {
    return issue.assignees.some((a) => isAnyUser(a, usernames));
  }
  return isAnyUser(issue.assignee, usernames);
};

export const isPRNeedingReview = (
  pr: IPullRequest,
  usernameOrList?: string | string[] | null,
): boolean => {
  if (!usernameOrList) return false;
  const usernames = Array.isArray(usernameOrList)
    ? usernameOrList
    : [usernameOrList];
  if (usernames.length === 0) return false;
  if (pr.state !== "open") return false;
  if (isAnyUser(pr.author, usernames)) return false;
  if (pr.reviewRequested) return true;
  return Boolean(pr.mentionedInDescription && !pr.reviewedByMe);
};

export type ProjectReviewStatus =
  | "approved"
  | "changes_requested"
  | "reviewed"
  | "needs_review";

export const getProjectReviewStatus = (
  pr: IPullRequest,
  reviewedUrls?: Set<string>,
): ProjectReviewStatus | null => {
  const myState = pr.myReviewState?.toUpperCase();
  if (myState === "APPROVED") return "approved";
  if (myState === "CHANGES_REQUESTED") return "changes_requested";
  if (pr.reviewedByMe || (pr.url && reviewedUrls?.has(pr.url))) {
    return "reviewed";
  }
  if (
    pr.state === "open" &&
    (pr.reviewRequested || pr.mentionedInDescription)
  ) {
    return "needs_review";
  }
  return null;
};

export const isProjectReviewPR = (
  pr: IPullRequest,
  usernameOrList?: string | string[] | null,
  reviewedUrls?: Set<string>,
): boolean => {
  if (!usernameOrList) return false;
  const usernames = Array.isArray(usernameOrList)
    ? usernameOrList
    : [usernameOrList];
  if (usernames.length === 0) return false;
  if (isAnyUser(pr.author, usernames)) return false;

  return getProjectReviewStatus(pr, reviewedUrls) !== null;
};

export const isValidFigmaUrl = (url: string): boolean => {
  try {
    const parsed = new URL(url.trim());
    return (
      parsed.protocol === "https:" &&
      (parsed.hostname === "figma.com" || parsed.hostname.endsWith(".figma.com"))
    );
  } catch {
    return false;
  }
};

export const toFigmaEmbedUrl = (url: string): string => {
  const trimmed = url.trim();
  if (trimmed.includes("figma.com/embed")) {
    return trimmed;
  }
  return `https://www.figma.com/embed?embed_host=share&url=${encodeURIComponent(trimmed)}`;
};

export const buildCategoryMaps = (
  projects: IProject[] = [],
  integrations: IIntegration[] = [],
) => {
  const repoCategoriesMap: Record<string, ProjectCategory[]> = {};
  for (const project of projects) {
    for (const repo of project.repos || []) {
      const key = repo.toLowerCase();
      if (!repoCategoriesMap[key]) repoCategoriesMap[key] = [];
      if (!repoCategoriesMap[key].includes(project.category)) {
        repoCategoriesMap[key].push(project.category);
      }
    }
  }

  const integrationCategoryMap: Record<string, ProjectCategory> = {};
  for (const integration of integrations) {
    const label = integration.label?.trim().toLowerCase();
    if (label === "office" || label === "freelance" || label === "personal") {
      integrationCategoryMap[integration._id] = label;
    }
  }

  return { repoCategoriesMap, integrationCategoryMap };
};

export const matchesCategoryFilter = (
  item: { repoName?: string; integrationId?: string },
  filter: "all" | ProjectCategory,
  repoCategoriesMap: Record<string, ProjectCategory[]>,
  integrationCategoryMap: Record<string, ProjectCategory>,
): boolean => {
  if (filter === "all") return true;
  const repoKey = item.repoName?.toLowerCase() || "";
  const repoCategories = repoCategoriesMap[repoKey];
  if (repoCategories && repoCategories.length > 0) {
    return repoCategories.includes(filter);
  }
  if (item.integrationId && integrationCategoryMap[item.integrationId]) {
    return integrationCategoryMap[item.integrationId] === filter;
  }
  return false;
};

export const parseGitHubUrl = (
  url: string,
): { kind: "pr" | "issue"; repo: string; number: number } | null => {
  const match = url.match(/github\.com\/([^/]+\/[^/]+)\/(pull|issues)\/(\d+)/i);
  if (!match) return null;
  return {
    repo: match[1],
    kind: match[2].toLowerCase() === "pull" ? "pr" : "issue",
    number: Number(match[3]),
  };
};

