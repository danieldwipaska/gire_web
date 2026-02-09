import Issue from "@/models/Issue";
import PullRequest from "@/models/PullRequest";
import { Octokit } from "octokit";

export async function syncGitHubData(userId: string, token: string) {
  const octokit = new Octokit({ auth: token });

  // Tentukan batas waktu (misal: 14 hari ke belakang atau sejak sync terakhir)
  const sinceDate = new Date();
  sinceDate.setDate(sinceDate.getDate() - 14);

  try {
    // 1. SYNC ISSUES
    const issues = await octokit.paginate(
      octokit.rest.issues.listForAuthenticatedUser,
      {
        since: sinceDate.toISOString(),
        state: "all",
        per_page: 100,
      },
    );

    for (const issue of issues) {
      if (issue.pull_request) continue; // Octokit menganggap PR sebagai Issue juga
      await Issue.findOneAndUpdate(
        { githubId: issue.id },
        {
          title: issue.title,
          state: issue.state,
          repoName: issue.repository?.full_name,
          url: issue.html_url,
          updatedAt: issue.updated_at,
          userId,
        },
        { upsert: true },
      );
    }

    // 2. SYNC PULL REQUESTS
    // GitHub API tidak punya filter 'since' langsung di list PR,
    // jadi kita ambil yang terbaru dan filter manual.
    const prs = await octokit.paginate(
      octokit.rest.search.issuesAndPullRequests,
      {
        q: `author:@me type:pr updated:>${sinceDate.toISOString().split("T")[0]}`,
        per_page: 100,
      },
    );

    // Limit 1000 items
    const limitedPrs = prs.slice(0, 1000);

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
        },
        { upsert: true },
      );
    }
  } catch (error) {
    throw error;
  }
}
