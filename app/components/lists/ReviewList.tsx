import PullRequestCard from '../cards/PullRequestCard';
import ListContainer from './ListContainer';
import { IPullRequest } from '@/lib/types';

const ReviewList = ({ reviews, isLoading }: { reviews: IPullRequest[]; isLoading: boolean }) => {
  if (isLoading) return <div>Loading...</div>;

  return (
    <ListContainer title="PRs Needing Review">
      <div className="space-y-3 max-h-125 overflow-auto pr-2">
        {reviews.map((pr) => (
          <PullRequestCard key={pr._id} title={pr.title} state={pr.state} repoName={pr.repoName} additions={pr.additions} deletions={pr.deletions} comments={pr.comments} url={pr.url} mergedAt={pr.mergedAt} updatedAt={pr.updatedAt} />
        ))}
      </div>
    </ListContainer>
  );
};

export default ReviewList;
