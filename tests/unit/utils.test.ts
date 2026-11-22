import { describe, expect, it } from "vitest";
import {
  buildCategoryMaps,
  getProjectReviewStatus,
  isAnyUser,
  isIssueAssignedTo,
  isPRNeedingReview,
  isProjectReviewPR,
  isSameUser,
  isValidFigmaUrl,
  matchesCategoryFilter,
  parseGitHubUrl,
  toFigmaEmbedUrl,
} from "@/lib/utils";
import { IIntegration, IIssue, IProject, IPullRequest } from "@/lib/types";

const makeIssue = (overrides: Partial<IIssue> = {}): IIssue => ({
  _id: "issue-1",
  githubId: 101,
  title: "Fix bug",
  state: "open",
  repoName: "org/office-api",
  url: "https://github.com/org/office-api/issues/12",
  mentionedInDescription: false,
  author: "alice",
  assignee: "bob",
  assignees: [],
  updatedAt: new Date().toISOString(),
  userId: "user-1",
  ...overrides,
});

const makePR = (overrides: Partial<IPullRequest> = {}): IPullRequest => ({
  _id: "pr-1",
  githubId: 202,
  title: "Add feature",
  state: "open",
  repoName: "org/office-api",
  additions: 10,
  deletions: 2,
  changedFiles: 1,
  comments: 0,
  url: "https://github.com/org/office-api/pull/44",
  mentionedInDescription: false,
  reviewRequested: false,
  reviewedByMe: false,
  author: "teammate",
  assignee: null,
  mergedAt: null,
  updatedAt: new Date().toISOString(),
  userId: "user-1",
  ...overrides,
});

describe("user & GitHub matching helpers", () => {
  it("compares usernames case-insensitively", () => {
    expect(isSameUser("NielDev", "nieldev")).toBe(true);
    expect(isSameUser("NielDev", "other")).toBe(false);
    expect(isSameUser(null, "nieldev")).toBe(false);
    expect(isAnyUser("FreelanceUser", ["officeUser", "freelanceuser"])).toBe(true);
  });

  it("checks multi-assignee arrays before falling back to single assignee", () => {
    const multi = makeIssue({ assignee: "alice", assignees: ["alice", "NielDev"] });
    expect(isIssueAssignedTo(multi, "nieldev")).toBe(true);

    const legacy = makeIssue({ assignee: "NielDev", assignees: [] });
    expect(isIssueAssignedTo(legacy, "nieldev")).toBe(true);
    expect(isIssueAssignedTo(legacy, ["other"])).toBe(false);
  });

  it("accurately determines PRs needing review", () => {
    // Direct review request on open PR from another author
    expect(
      isPRNeedingReview(makePR({ reviewRequested: true }), "niel"),
    ).toBe(true);

    // Closed/merged PRs should never appear in active review queue
    expect(
      isPRNeedingReview(makePR({ state: "closed", reviewRequested: true }), "niel"),
    ).toBe(false);

    // Own PRs should never appear in review queue
    expect(
      isPRNeedingReview(makePR({ author: "Niel", reviewRequested: true }), "niel"),
    ).toBe(false);

    // Mentioned in description disappears once reviewedByMe is true
    expect(
      isPRNeedingReview(
        makePR({ mentionedInDescription: true, reviewedByMe: false }),
        "niel",
      ),
    ).toBe(true);
    expect(
      isPRNeedingReview(
        makePR({ mentionedInDescription: true, reviewedByMe: true }),
        "niel",
      ),
    ).toBe(false);

    // Re-requested review (reviewRequested=true) stays active even if previously reviewed
    expect(
      isPRNeedingReview(
        makePR({ reviewRequested: true, reviewedByMe: true }),
        "niel",
      ),
    ).toBe(true);
  });
});

describe("URL & Figma helpers", () => {
  it("parses PR and Issue GitHub URLs", () => {
    expect(parseGitHubUrl("https://github.com/acme/web/pull/123")).toEqual({
      kind: "pr",
      repo: "acme/web",
      number: 123,
    });
    expect(parseGitHubUrl("https://github.com/acme/web/issues/45")).toEqual({
      kind: "issue",
      repo: "acme/web",
      number: 45,
    });
    expect(parseGitHubUrl("https://github.com/acme/web/commit/abc")).toBeNull();
  });

  it("validates and converts Figma URLs to embed URLs", () => {
    expect(isValidFigmaUrl("https://www.figma.com/design/abc/App")).toBe(true);
    expect(isValidFigmaUrl("https://figma.com/proto/abc/Proto")).toBe(true);
    expect(isValidFigmaUrl("http://www.figma.com/design/abc/App")).toBe(false);
    expect(isValidFigmaUrl("https://evil.com/figma.com")).toBe(false);

    const shareUrl = "https://www.figma.com/design/abc/App";
    expect(toFigmaEmbedUrl(shareUrl)).toBe(
      `https://www.figma.com/embed?embed_host=share&url=${encodeURIComponent(shareUrl)}`,
    );
  });
});

describe("workspace category filtering", () => {
  const projects: IProject[] = [
    {
      _id: "proj-1",
      name: "Core Office",
      category: "office",
      status: "active",
      ownerId: "u1",
      members: [],
      repos: ["org/office-api"],
      figmaLinks: [],
    },
    {
      _id: "proj-2",
      name: "Client X",
      category: "freelance",
      status: "active",
      ownerId: "u1",
      members: [],
      repos: ["client/landing"],
      figmaLinks: [],
    },
  ];

  const integrations: IIntegration[] = [
    {
      _id: "int-1",
      userId: "u1",
      provider: "github",
      label: "Freelance",
      githubUsername: "niel-freelance",
      lastSync: new Date().toISOString(),
      status: "active",
    },
  ];

  it("prefers linked project category and falls back to integration label", () => {
    const { repoCategoriesMap, integrationCategoryMap } = buildCategoryMaps(
      projects,
      integrations,
    );

    expect(
      matchesCategoryFilter(
        { repoName: "org/office-api", integrationId: "int-1" },
        "office",
        repoCategoriesMap,
        integrationCategoryMap,
      ),
    ).toBe(true);

    expect(
      matchesCategoryFilter(
        { repoName: "unmapped/side-repo", integrationId: "int-1" },
        "freelance",
        repoCategoriesMap,
        integrationCategoryMap,
      ),
    ).toBe(true);

    expect(
      matchesCategoryFilter(
        { repoName: "unmapped/side-repo", integrationId: "int-1" },
        "office",
        repoCategoriesMap,
        integrationCategoryMap,
      ),
    ).toBe(false);
  });
});

describe("isProjectReviewPR and getProjectReviewStatus", () => {
  const basePr: IPullRequest = {
    _id: "pr-r1",
    githubId: 901,
    title: "Refactor auth",
    state: "open",
    repoName: "org/repo",
    additions: 10,
    deletions: 4,
    changedFiles: 2,
    comments: 0,
    url: "https://github.com/org/repo/pull/901",
    mentionedInDescription: false,
    reviewRequested: false,
    reviewedByMe: false,
    myReviewState: null,
    author: "teammate",
    assignee: null,
    mergedAt: null,
    updatedAt: new Date().toISOString(),
    userId: "u1",
  };

  it("includes PRs needing review, reviewed PRs, and approved PRs while excluding own PRs", () => {
    expect(
      isProjectReviewPR({ ...basePr, author: "niel-dev", reviewRequested: true }, ["niel-dev"]),
    ).toBe(false);

    const needs = { ...basePr, reviewRequested: true };
    expect(isProjectReviewPR(needs, ["niel-dev"])).toBe(true);
    expect(getProjectReviewStatus(needs)).toBe("needs_review");

    const approved = {
      ...basePr,
      state: "closed",
      reviewedByMe: true,
      myReviewState: "APPROVED",
    };
    expect(isProjectReviewPR(approved, ["niel-dev"])).toBe(true);
    expect(getProjectReviewStatus(approved)).toBe("approved");

    const changesReq = {
      ...basePr,
      reviewedByMe: true,
      myReviewState: "CHANGES_REQUESTED",
    };
    expect(getProjectReviewStatus(changesReq)).toBe("changes_requested");

    const historicalEvent = {
      ...basePr,
      state: "closed",
    };
    const urls = new Set([basePr.url]);
    expect(isProjectReviewPR(historicalEvent, ["niel-dev"], urls)).toBe(true);
    expect(getProjectReviewStatus(historicalEvent, urls)).toBe("reviewed");
  });
});

