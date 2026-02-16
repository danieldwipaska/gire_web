import ListContainer from "./ListContainer";
import PullRequestCard from "../cards/PullRequestCard";
import { Props as PRProps } from "../cards/PullRequestCard";


const PullRequestList = ({ pullRequests, isLoading }: { pullRequests: PRProps[]; isLoading: boolean }) => {
  if (isLoading) return <div>Loading...</div>;

  return (
    <>
      <ListContainer title="Today's PRs">
        <div className="space-y-3 max-h-125 overflow-auto pr-2">
          {pullRequests?.map((pullRequest: PRProps, index: number) => (
            <PullRequestCard
              key={index}
              title={pullRequest.title}
              state={pullRequest.state}
              repoName={pullRequest.repoName}
              additions={pullRequest.additions}
              deletions={pullRequest.deletions}
              comments={pullRequest.comments}
              url={pullRequest.url}
              updatedAt={pullRequest.updatedAt}
              mergedAt={pullRequest.mergedAt}
            />
          ))}
        </div>
      </ListContainer>
    </>
  );
};

export default PullRequestList;
