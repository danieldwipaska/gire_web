import { IIssue, IPullRequest } from "./types";

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

export const isIssueAssignedTo = (issue: IIssue, username?: string | null): boolean => {
  if (!username) return false;
  if (Array.isArray(issue.assignees) && issue.assignees.length > 0) {
    return issue.assignees.some((a) => isSameUser(a, username));
  }
  return isSameUser(issue.assignee, username);
};

export const isPRNeedingReview = (pr: IPullRequest, username?: string | null): boolean => {
  if (!username) return false;
  if (pr.state !== "open") return false;
  if (isSameUser(pr.author, username)) return false;
  if (pr.reviewRequested) return true;
  return Boolean(pr.mentionedInDescription && !pr.reviewedByMe);
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

