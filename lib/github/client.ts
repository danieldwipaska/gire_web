import connectDB from "@/lib/mongodb";
import ActivityEvent from "@/models/ActivityEvent";
import Integration from "@/models/Integration";
import Issue from "@/models/Issue";
import PullRequest from "@/models/PullRequest";

export interface GitHubAccountCandidate {
  _id: string;
  githubUsername: string;
  accessToken: string;
}

/**
 * Returns candidate GitHub integrations ordered so the account that synced
 * `repo` is tried first, followed by any other connected GitHub accounts.
 */
export async function getCandidateIntegrationsForRepo(
  userId: string,
  repo: string,
): Promise<GitHubAccountCandidate[]> {
  await connectDB();

  const integrations = await Integration.find({
    userId,
    provider: "github",
  }).lean();

  if (integrations.length === 0) return [];
  if (integrations.length === 1) {
    return integrations.map((i) => ({
      _id: i._id.toString(),
      githubUsername: i.githubUsername,
      accessToken: i.accessToken,
    }));
  }

  // Check cached records for this repo to find which integrationId synced it
  const [prHit, issueHit, eventHit] = await Promise.all([
    PullRequest.findOne({ userId, repoName: repo, integrationId: { $ne: null } })
      .select("integrationId")
      .lean(),
    Issue.findOne({ userId, repoName: repo, integrationId: { $ne: null } })
      .select("integrationId")
      .lean(),
    ActivityEvent.findOne({ userId, repoName: repo, integrationId: { $ne: null } })
      .select("integrationId")
      .lean(),
  ]);

  const preferredId =
    prHit?.integrationId?.toString() ||
    issueHit?.integrationId?.toString() ||
    eventHit?.integrationId?.toString();

  const sorted = [...integrations].sort((a, b) => {
    if (a._id.toString() === preferredId) return -1;
    if (b._id.toString() === preferredId) return 1;
    return 0;
  });

  return sorted.map((i) => ({
    _id: i._id.toString(),
    githubUsername: i.githubUsername,
    accessToken: i.accessToken,
  }));
}

export async function runWithRepoOctokit<T>(
  userId: string,
  repo: string,
  fn: (candidate: GitHubAccountCandidate) => Promise<T>,
): Promise<{ result: T; integration: GitHubAccountCandidate }> {
  const candidates = await getCandidateIntegrationsForRepo(userId, repo);
  if (candidates.length === 0) {
    throw new Error("GitHub integration not found");
  }

  let lastError: unknown = null;
  for (const candidate of candidates) {
    try {
      const result = await fn(candidate);
      return { result, integration: candidate };
    } catch (err) {
      lastError = err;
      const status = (err as { status?: number })?.status;
      // Only retry with another GitHub account on auth/visibility errors
      if (status !== 404 && status !== 403 && status !== 401) {
        throw err;
      }
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("Failed to access GitHub repository");
}

