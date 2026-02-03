'use client';

import ListContainer from './ListContainer';
import PullRequestCard from '../cards/PullRequestCard';
import { useEffect, useState } from 'react';

const PullRequestList = () => {
  const [pullRequests, setPullRequests] = useState<any>(null);

  useEffect(() => {
    fetch('http://localhost:3000/api/pulls')
      .then((res) => res.json())
      .then((data) => setPullRequests(data))
      .catch((err) => console.log(err));
  }, []);

  return (
    <>
      <ListContainer title="Today's PRs">
        <div className="space-y-3 max-h-125 overflow-auto pr-2">
          {pullRequests?.map(({ title, state, repoName, additions, deletions, comments, url, mergedAt }: any, index: number) => (
            <PullRequestCard key={index} title={title} state={state} repoName={repoName} additions={additions} deletions={deletions} comments={comments} url={url} mergedAt={mergedAt} />
          ))}
        </div>
      </ListContainer>
    </>
  );
};

export default PullRequestList;
