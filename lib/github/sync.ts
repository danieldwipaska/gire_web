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

  // Tentukan batas waktu (misal: 14 hari ke belakang atau sejak sync terakhir)
  const sinceDate = new Date();
  sinceDate.setDate(sinceDate.getDate() - 30);

  try {
    // 1. SYNC ISSUES
    if (onProgress) onProgress(10, "Fetching issues...");
    // Kita perlu search issues karena listForAuthenticatedUser tidak support filter mentions dengan mudah
    // dan kita ingin menangkap issue dimana user di-mention juga.
    // Tapi untuk menjaga kompatibilitas dengan logika awal (listForAuthenticatedUser),
    // kita bisa tetap pakai listForAuthenticatedUser tapi ini hanya issues yang assigned/created/mentioned authenticated user.
    // Dokumentasi: "List issues assigned to the authenticated user".
    // "List issues across owned and member repositories assigned to the authenticated user."
    // Jadi defaultnya sudah mencakup assigned.
    // Untuk 'mentioned', kita sebaiknya gunakan search API agar lebih pasti atau pastikan filter 'filter' parameter benar.
    // Default filter is 'assigned', 'created', 'mentioned', 'subscribed'. Jadi 'all' seharusnya sudah mencakup mentioned.
    
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

      if (issue.pull_request) continue; // Octokit menganggap PR sebagai Issue juga
      
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
    // GitHub API tidak punya filter 'since' langsung di list PR,
    // jadi kita ambil yang terbaru dan filter manual.
    // Kita update query untuk mengambil PR dimana user adalah author, mentioned, atau review-requested.
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

      // Ambil detail PR untuk mendapatkan additions/deletions
      // Format repo full name biasanya didapat dari field repository_url
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
