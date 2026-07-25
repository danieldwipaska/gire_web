import ListContainer from "./ListContainer";
import PullRequestCard from "../cards/PullRequestCard";
import { IPullRequest } from "@/lib/types";


const PullRequestList = ({ pullRequests, isLoading }: { pullRequests: IPullRequest[]; isLoading: boolean }) => {
  if (isLoading) return <div className="text-slate-400 text-sm py-4">Loading pull requests...</div>;

  return (
    <ListContainer title="My Pull Requests">
      <div className="space-y-3 max-h-125 overflow-auto pr-2">
        {(!pullRequests || pullRequests.length === 0) ? (
          <p className="text-slate-400 text-sm py-4">No pull requests found.</p>
        ) : (
          pullRequests.map((pullRequest: IPullRequest, index: number) => (
            <PullRequestCard
              key={pullRequest._id || index}
              title={pullRequest.title}
              state={pullRequest.state}
              repoName={pullRequest.repoName}
              additions={pullRequest.additions}
              deletions={pullRequest.deletions}
              comments={pullRequest.comments}
              url={pullRequest.url}
              updatedAt={pullRequest.updatedAt}
              mergedAt={pullRequest.mergedAt}
              author={pullRequest.author}
            />
          ))
        )}
      </div>
    </ListContainer>
  );
};

export default PullRequestList;
