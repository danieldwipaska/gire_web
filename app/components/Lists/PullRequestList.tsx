'use client';

import ListContainer from './ListContainer';
import PullRequestCard from '../cards/PullRequestCard';

const PullRequestList = () => {
  return (
    <>
      <ListContainer title="Today's PRs">
        <div className="space-y-3 max-h-125 overflow-auto pr-2">
          <PullRequestCard />
          <PullRequestCard />
          <PullRequestCard />
          <PullRequestCard />
          <PullRequestCard />
          <PullRequestCard />
        </div>
      </ListContainer>
    </>
  );
};

export default PullRequestList;
