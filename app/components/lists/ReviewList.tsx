'use client';

import PullRequestCard from '../cards/PullRequestCard';
import ListContainer from './ListContainer';

const ReviewList = () => {
  return (
    <ListContainer title="PRs Needing Review">
      <div className="space-y-3 max-h-125 overflow-auto pr-2">
        <PullRequestCard />
        <PullRequestCard />
        <PullRequestCard />
        <PullRequestCard />
        <PullRequestCard />
        <PullRequestCard />
      </div>
    </ListContainer>
  );
};

export default ReviewList;
