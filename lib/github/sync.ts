import Integration from "@/models/Integration";
import Issue from "@/models/Issue";
import PullRequest from "@/models/PullRequest";
import { isSameUser } from "@/lib/utils";
import { Octokit } from "octokit";

interface SyncOptions {
  fullSync?: boolean;
  integrationId?: string;
}

export async function syncGitHubData(
  userId: string,
  token: string,
  onProgress?: (progress: number, message: string) => void,
  options?: SyncOptions,
) {
  const octokit = new Octokit({ auth: token });

  if (onProgress) onProgress(5, "Authenticating with GitHub...");

  // Ensure compound indexes exist and legacy single-field unique indexes are cleaned up
  await Promise.all([
    Integration.syncIndexes(),
    Issue.syncIndexes(),
    PullRequest.syncIndexes(),
  ]);

  let username: string;
  try {
    const { data: user } = await octokit.rest.users.getAuthenticated();
    username = user.login;
  } catch (error: unknown) {
    const status = (error as { status?: number })?.status;
    if (status === 401 || status === 403) {
      await Integration.updateMany(
        { userId, provider: "github", ...(options?.integrationId ? { _id: options.integrationId } : {}) },
        { status: "expired" },
      );
    }
    throw error;
  }

  const integrationFilter = options?.integrationId
    ? { _id: options.integrationId, userId }
    : { userId, provider: "github" };

  const integration = await Integration.findOne(integrationFilter);

  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);

  const needsFullYearSync =
    Boolean(options?.fullSync) ||
    !integration?.lastFullSync ||
    new Date(integration.lastFullSync).getFullYear() < now.getFullYear();

  let sinceDate = startOfYear;
  if (!needsFullYearSync && integration?.lastSync) {
    // Incremental sync with a 24-hour overlap buffer for safety
    const bufferedLastSync = new Date(
      new Date(integration.lastSync).getTime() - 24 * 60 * 60 * 1000,
    );
    sinceDate = bufferedLastSync > startOfYear ? bufferedLastSync : startOfYear;
  }

  try {
    // 1. SYNC ISSUES
    if (onProgress) onProgress(10, "Fetching issues...");

    const [openIssues, closedIssues] = await Promise.all([
      octokit.paginate(octokit.rest.issues.list, {
        filter: "assigned",
        state: "open",
        per_page: 100,
      }),
      octokit.paginate(octokit.rest.issues.list, {
        since: sinceDate.toISOString(),
        filter: "assigned",
        state: "closed",
        per_page: 100,
      }),
    ]);

    const uniqueIssuesMap = new Map<number, (typeof openIssues)[number]>();
    for (const issue of [...openIssues, ...closedIssues]) {
      if (!issue.pull_request) {
        uniqueIssuesMap.set(issue.id, issue);
      }
    }
    const issues = Array.from(uniqueIssuesMap.values());

    const totalIssues = issues.length;
    let processedIssues = 0;

    for (const issue of issues) {
      processedIssues++;
      if (onProgress && totalIssues > 0) {
        const progress = 10 + Math.floor((processedIssues / totalIssues) * 20);
        onProgress(progress, `Processing issue ${processedIssues}/${totalIssues}`);
      }

      const isMentioned = issue.body
        ? issue.body.toLowerCase().includes(`@${username.toLowerCase()}`)
        : false;
      const repoName =
        issue.repository?.full_name ||
        issue.repository_url?.replace("https://api.github.com/repos/", "") ||
        "";
      const assignees = (issue.assignees || [])
        .map((a) => a.login)
        .filter((login): login is string => Boolean(login));

      await Issue.findOneAndUpdate(
        { userId, githubId: issue.id },
        {
          title: issue.title,
          state: issue.state,
          repoName,
          url: issue.html_url,
          githubCreatedAt: issue.created_at,
          closedAt: issue.closed_at,
          updatedAt: issue.updated_at,
          userId,
          author: issue.user?.login,
          assignee: issue.assignee?.login || assignees[0] || null,
          assignees,
          mentionedInDescription: isMentioned,
        },
        { upsert: true },
      );
    }

    // 2. SYNC PULL REQUESTS
    if (onProgress) {
      onProgress(
        35,
        needsFullYearSync
          ? `Fetching pull requests since ${startOfYear.toISOString().split("T")[0]}...`
          : "Fetching recent pull requests...",
      );
    }

    const sinceDateStr = sinceDate.toISOString().split("T")[0];

    const [prsInvolved, prsReviewRequested] = await Promise.all([
      octokit.paginate(octokit.rest.search.issuesAndPullRequests, {
        q: `type:pr updated:>=${sinceDateStr} involves:${username}`,
        per_page: 100,
      }),
      octokit.paginate(octokit.rest.search.issuesAndPullRequests, {
        q: `type:pr updated:>=${sinceDateStr} review-requested:${username}`,
        per_page: 100,
      }),
    ]);

    if (onProgress) onProgress(40, "Processing pull requests...");

    const reviewRequestedIds = new Set(prsReviewRequested.map((pr) => pr.id));
    const uniquePrsMap = new Map<number, (typeof prsInvolved)[number]>();
    for (const pr of [...prsInvolved, ...prsReviewRequested]) {
      uniquePrsMap.set(pr.id, pr);
    }

    const limitedPrs = Array.from(uniquePrsMap.values()).slice(0, 1000);
    const totalPrs = limitedPrs.length;
    let processedPrs = 0;

    const BATCH_SIZE = 8;
    for (let i = 0; i < limitedPrs.length; i += BATCH_SIZE) {
      const batch = limitedPrs.slice(i, i + BATCH_SIZE);

      await Promise.all(
        batch.map(async (pr) => {
          const repoPath = pr.repository_url.replace(
            "https://api.github.com/repos/",
            "",
          );
          const [owner, repo] = repoPath.split("/");

          const { data: detail } = await octokit.rest.pulls.get({
            owner,
            repo,
            pull_number: pr.number,
          });

          const isMentioned = detail.body
            ? detail.body.toLowerCase().includes(`@${username.toLowerCase()}`)
            : false;

          const isDirectReviewer = detail.requested_reviewers
            ? detail.requested_reviewers.some((r) => isSameUser(r.login, username))
            : false;

          const isTeamReviewer =
            detail.state === "open" &&
            (detail.requested_teams?.length ?? 0) > 0 &&
            reviewRequestedIds.has(pr.id);

          const isReviewRequested = isDirectReviewer || isTeamReviewer;

          let reviewedByMe = false;
          if (
            detail.state === "open" &&
            !isSameUser(detail.user?.login, username) &&
            (isReviewRequested || isMentioned)
          ) {
            try {
              const { data: reviews } = await octokit.rest.pulls.listReviews({
                owner,
                repo,
                pull_number: pr.number,
                per_page: 100,
              });
              reviewedByMe = reviews.some(
                (r) => isSameUser(r.user?.login, username) && r.state !== "PENDING",
              );
            } catch {
              reviewedByMe = false;
            }
          }

          await PullRequest.findOneAndUpdate(
            { userId, githubId: pr.id },
            {
              title: detail.title,
              state: detail.state,
              repoName: repoPath,
              additions: detail.additions,
              deletions: detail.deletions,
              changedFiles: detail.changed_files,
              comments: (detail.comments || 0) + (detail.review_comments || 0),
              url: detail.html_url,
              githubCreatedAt: detail.created_at,
              closedAt: detail.closed_at,
              mergedAt: detail.merged_at,
              updatedAt: detail.updated_at,
              userId,
              author: detail.user?.login,
              assignee: detail.assignee?.login || null,
              mentionedInDescription: isMentioned,
              reviewRequested: isReviewRequested,
              reviewedByMe,
            },
            { upsert: true },
          );
        }),
      );

      processedPrs += batch.length;
      if (onProgress && totalPrs > 0) {
        const progress = 40 + Math.floor((processedPrs / totalPrs) * 55);
        onProgress(progress, `Processing PR ${processedPrs}/${totalPrs}`);
      }
    }

    if (integration) {
      await Integration.findByIdAndUpdate(integration._id, {
        lastSync: new Date(),
        githubUsername: username,
        status: "active",
        ...(needsFullYearSync ? { lastFullSync: new Date() } : {}),
      });
    }

    if (onProgress) onProgress(100, "Sync complete!");
  } catch (error) {
    throw error;
  }
}
