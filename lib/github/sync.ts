import ActivityEvent from "@/models/ActivityEvent";
import Integration from "@/models/Integration";
import Issue from "@/models/Issue";
import PullRequest from "@/models/PullRequest";
import { ActivityEventType } from "@/lib/types";
import { isSameUser } from "@/lib/utils";
import { Octokit } from "octokit";

interface SyncOptions {
  fullSync?: boolean;
  integrationId?: string;
}

interface RawGitHubEvent {
  id: string;
  type: string | null;
  created_at: string | null;
  actor?: { login?: string };
  repo?: { name?: string };
  payload?: {
    action?: string;
    number?: number;
    ref?: string;
    head?: string;
    size?: number;
    commits?: { message?: string }[];
    pull_request?: {
      number?: number;
      title?: string;
      html_url?: string;
      merged?: boolean;
    };
    issue?: {
      number?: number;
      title?: string;
      html_url?: string;
      pull_request?: unknown;
    };
    review?: {
      state?: string;
      body?: string | null;
      html_url?: string;
    };
    comment?: {
      body?: string | null;
      html_url?: string;
    };
  };
}

async function syncUserActivityEvents(
  octokit: Octokit,
  userId: string,
  username: string,
) {
  const allEvents: RawGitHubEvent[] = [];

  for (let page = 1; page <= 3; page++) {
    try {
      const { data } = await octokit.request("GET /users/{username}/events", {
        username,
        per_page: 100,
        page,
      });
      if (!Array.isArray(data) || data.length === 0) break;
      allEvents.push(...(data as RawGitHubEvent[]));
      if (data.length < 100) break;
    } catch {
      // GitHub returns 422 beyond 300 events; stop pagination cleanly
      break;
    }
  }

  if (allEvents.length === 0) return;

  // Build quick URL -> title lookup from recently synced PRs & Issues
  const [recentPrs, recentIssues] = await Promise.all([
    PullRequest.find({ userId }).select("url title").lean(),
    Issue.find({ userId }).select("url title").lean(),
  ]);
  const titleByUrl = new Map<string, string>();
  for (const pr of recentPrs) {
    if (pr.url && pr.title) titleByUrl.set(pr.url, pr.title);
  }
  for (const issue of recentIssues) {
    if (issue.url && issue.title) titleByUrl.set(issue.url, issue.title);
  }

  for (const ev of allEvents) {
    if (!ev.id || !ev.type || !ev.created_at) continue;
    const repoName = ev.repo?.name || "";
    if (!repoName) continue;

    const payload = ev.payload || {};
    const action = payload.action;

    let mappedType: ActivityEventType | null = null;
    let targetType: "pr" | "issue" | "push" = "pr";
    let targetNumber: number | undefined;
    let title = "";
    let description = "";
    let url = `https://github.com/${repoName}`;

    if (ev.type === "PullRequestEvent") {
      const pr = payload.pull_request;
      targetType = "pr";
      targetNumber = payload.number || pr?.number;
      url = pr?.html_url || (targetNumber ? `https://github.com/${repoName}/pull/${targetNumber}` : url);
      title = pr?.title || titleByUrl.get(url) || `PR #${targetNumber ?? ""}`.trim();

      if (action === "opened" || action === "reopened") {
        mappedType = "pr_created";
        description = action === "reopened" ? "Reopened pull request" : "Opened pull request";
      } else if (action === "closed") {
        mappedType = pr?.merged ? "pr_merged" : "pr_closed";
        description = pr?.merged ? "Merged pull request" : "Closed pull request";
      } else {
        mappedType = "pr_updated";
        description = action ? `PR ${action.replace(/_/g, " ")}` : "Updated pull request";
      }
    } else if (ev.type === "PullRequestReviewEvent") {
      const pr = payload.pull_request;
      targetType = "pr";
      targetNumber = pr?.number;
      url = pr?.html_url || (targetNumber ? `https://github.com/${repoName}/pull/${targetNumber}` : url);
      title = pr?.title || titleByUrl.get(url) || `PR #${targetNumber ?? ""}`.trim();
      mappedType = "pr_reviewed";
      const stateLabel = payload.review?.state
        ? payload.review.state.toLowerCase().replace(/_/g, " ")
        : "reviewed";
      const snippet = payload.review?.body?.trim().slice(0, 140);
      description = snippet ? `${stateLabel}: ${snippet}` : `Submitted review (${stateLabel})`;
    } else if (ev.type === "PullRequestReviewCommentEvent") {
      const pr = payload.pull_request;
      targetType = "pr";
      targetNumber = pr?.number;
      url = pr?.html_url || (targetNumber ? `https://github.com/${repoName}/pull/${targetNumber}` : url);
      title = pr?.title || titleByUrl.get(url) || `PR #${targetNumber ?? ""}`.trim();
      mappedType = "pr_commented";
      description = payload.comment?.body?.trim().slice(0, 140) || "Commented on PR diff";
    } else if (ev.type === "IssueCommentEvent") {
      const issue = payload.issue;
      const isPr = Boolean(issue?.pull_request);
      targetType = isPr ? "pr" : "issue";
      targetNumber = issue?.number;
      url =
        issue?.html_url ||
        (targetNumber
          ? `https://github.com/${repoName}/${isPr ? "pull" : "issues"}/${targetNumber}`
          : url);
      title =
        issue?.title ||
        titleByUrl.get(url) ||
        `${isPr ? "PR" : "Issue"} #${targetNumber ?? ""}`.trim();
      mappedType = isPr ? "pr_commented" : "issue_commented";
      description = payload.comment?.body?.trim().slice(0, 140) || "Added comment";
    } else if (ev.type === "IssuesEvent") {
      const issue = payload.issue;
      targetType = "issue";
      targetNumber = issue?.number;
      url = issue?.html_url || (targetNumber ? `https://github.com/${repoName}/issues/${targetNumber}` : url);
      title = issue?.title || titleByUrl.get(url) || `Issue #${targetNumber ?? ""}`.trim();
      if (action === "closed") {
        mappedType = "issue_closed";
        description = "Closed issue";
      } else {
        mappedType = "issue_opened";
        description = action ? `Issue ${action.replace(/_/g, " ")}` : "Updated issue";
      }
    } else if (ev.type === "PushEvent") {
      targetType = "push";
      mappedType = "pushed";
      const branch = payload.ref?.replace("refs/heads/", "") || "branch";
      const commitCount = payload.size || payload.commits?.length || 1;
      const firstCommitMsg = payload.commits?.[0]?.message?.split("\n")[0];
      title = firstCommitMsg || `Pushed to ${branch}`;
      description = `${commitCount} commit${commitCount === 1 ? "" : "s"} to ${branch}`;
      url = payload.head
        ? `https://github.com/${repoName}/commit/${payload.head}`
        : `https://github.com/${repoName}/tree/${branch}`;
    }

    if (!mappedType) continue;

    await ActivityEvent.findOneAndUpdate(
      { userId, githubEventId: ev.id },
      {
        userId,
        githubEventId: ev.id,
        type: mappedType,
        rawType: ev.type,
        action,
        actor: ev.actor?.login || username,
        repoName,
        targetType,
        targetNumber,
        title,
        description,
        url,
        occurredAt: new Date(ev.created_at),
      },
      { upsert: true },
    );
  }
}

export async function syncGitHubData(
  userId: string,
  token: string,
  onProgress?: (progress: number, message: string) => void,
  options?: SyncOptions,
) {
  const octokit = new Octokit({ auth: token });

  if (onProgress) onProgress(5, "Authenticating with GitHub...");

  await Promise.all([
    Integration.syncIndexes(),
    Issue.syncIndexes(),
    PullRequest.syncIndexes(),
    ActivityEvent.syncIndexes(),
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
        const progress = 40 + Math.floor((processedPrs / totalPrs) * 48);
        onProgress(progress, `Processing PR ${processedPrs}/${totalPrs}`);
      }
    }

    // 3. SYNC USER ACTIVITY EVENTS
    if (onProgress) onProgress(92, "Syncing your activity timeline...");
    await syncUserActivityEvents(octokit, userId, username);

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
