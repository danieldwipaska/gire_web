import Issue from "@/models/Issue";
import PullRequest from "@/models/PullRequest";
import { Octokit } from "octokit";

export async function syncGitHubData(userId: string, token: string) {
  const octokit = new Octokit({ auth: token });

  // Get authenticated user's login needed for checking mentions
  const { data: user } = await octokit.rest.users.getAuthenticated();
  const username = user.login;

  // Tentukan batas waktu (misal: 14 hari ke belakang atau sejak sync terakhir)
  const sinceDate = new Date();
  sinceDate.setDate(sinceDate.getDate() - 30);

  try {
    // 1. SYNC ISSUES
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
      octokit.rest.issues.listForAuthenticatedUser,
      {
        since: sinceDate.toISOString(),
        filter: "all", // assigned, created, mentioned, subscribed
        state: "all",
        per_page: 100,
      },
    );

    for (const issue of issues) {
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
    const allPrs = [...prsInvolved, ...prsReviewRequested];
    const uniquePrsMap = new Map();
    for (const pr of allPrs) {
      uniquePrsMap.set(pr.id, pr);
    }
    const uniquePrs = Array.from(uniquePrsMap.values());

    // Limit 1000 items
    const limitedPrs = uniquePrs.slice(0, 1000);

    for (const pr of limitedPrs) {
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
  } catch (error) {
    throw error;
  }
}
