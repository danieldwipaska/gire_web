import Issue from "@/models/Issue";
import PullRequest from "@/models/PullRequest";
import { Octokit } from "octokit";

export async function syncGitHubData(
  userId: string,
  token: string,
  onProgress?: (progress: number, message: string) => void,
) {
  const octokit = new Octokit({ auth: token });
  
  if (onProgress) onProgress(5, "Authenticating implementation...");

  // Get authenticated user's login needed for checking mentions
  const { data: user } = await octokit.rest.users.getAuthenticated();
  const username = user.login;

  // Set time limit (e.g., last 30 days)
  const sinceDate = new Date();
  sinceDate.setDate(sinceDate.getDate() - 30);

  try {
    // 1. SYNC ISSUES
    if (onProgress) onProgress(10, "Fetching issues...");
    
    // Fetch assigned issues. The default 'assigned' filter covers what we need.
    const issues = await octokit.paginate(
      octokit.rest.issues.list,
      {
        since: sinceDate.toISOString(),
        filter: "assigned", 
        state: "all",
        per_page: 100,
      },
    );

    const totalIssues = issues.length;
    let processedIssues = 0;

    for (const issue of issues) {
      processedIssues++;
      if (onProgress) {
        // Map 10% - 30% range for issues
        const progress = 10 + Math.floor((processedIssues / totalIssues) * 20);
        onProgress(progress, `Processing issue ${processedIssues}/${totalIssues}`);
      }

      if (issue.pull_request) continue; // Skip PRs (Octokit treats PRs as issues)
      
      const isMentioned = issue.body ? issue.body.includes(`@${username}`) : false;

      await Issue.findOneAndUpdate(
        { githubId: issue.id },
        {
          title: issue.title,
          state: issue.state,
          repoName: issue.repository?.full_name,
          url: issue.html_url,
          updatedAt: issue.updated_at,
          userId,
          author: issue.user?.login,
          assignee: issue.assignee?.login,
          mentionedInDescription: isMentioned,
        },
        { upsert: true },
      );
    }

    // 2. SYNC PULL REQUESTS
    if (onProgress) onProgress(35, "Fetching pull requests...");
    
    // Fetch PRs where user is author, mentioned, or review requested.
    // GitHub API doesn't support 'since' filter for PR lists directly, so we use search.

    // Query 1: Involves (author, assignee, mentions, commenter)
    const prsInvolved = await octokit.paginate(
      octokit.rest.search.issuesAndPullRequests,
      {
        q: `type:pr updated:>${sinceDate.toISOString().split("T")[0]} involves:${username}`,
        per_page: 100,
      },
    );

    // Query 2: Review Requested
    const prsReviewRequested = await octokit.paginate(
      octokit.rest.search.issuesAndPullRequests,
      {
        q: `type:pr updated:>${sinceDate.toISOString().split("T")[0]} review-requested:${username}`,
        per_page: 100,
      },
    );

    // Merge and deduplicate
    if (onProgress) onProgress(40, "Processing pull requests...");
    const allPrs = [...prsInvolved, ...prsReviewRequested];
    const uniquePrsMap = new Map();
    for (const pr of allPrs) {
      uniquePrsMap.set(pr.id, pr);
    }
    const uniquePrs = Array.from(uniquePrsMap.values());

    // Limit 1000 items
    const limitedPrs = uniquePrs.slice(0, 1000);
    const totalPrs = limitedPrs.length;
    let processedPrs = 0;

    for (const pr of limitedPrs) {
      processedPrs++;
      if (onProgress) {
        // Map 40% - 90% range for PRs
        const progress = 40 + Math.floor((processedPrs / totalPrs) * 50);
        onProgress(progress, `Processing PR ${processedPrs}/${totalPrs}`);
      }

      // Fetch PR details for stats (additions/deletions)
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

      const isMentioned = detail.body ? detail.body.includes(`@${username}`) : false;
      const isReviewRequested = detail.requested_reviewers
        ? detail.requested_reviewers.some((r) => r.login === username)
        : false;

      await PullRequest.findOneAndUpdate(
        { githubId: pr.id },
        {
          title: pr.title,
          state: pr.state,
          repoName: repoPath,
          additions: detail.additions,
          deletions: detail.deletions,
          changedFiles: detail.changed_files,
          comments: detail.comments,
          url: detail.html_url,
          mergedAt: detail.merged_at,
          updatedAt: pr.updated_at,
          userId,
          author: detail.user?.login,
          assignee: detail.assignee?.login,
          mentionedInDescription: isMentioned,
          reviewRequested: isReviewRequested,
        },
        { upsert: true },
      );
    }
    
    if (onProgress) onProgress(100, "Sync complete!");
  } catch (error) {
    throw error;
  }
}
