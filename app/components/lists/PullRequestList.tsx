"use client";

import ListContainer from "./ListContainer";
import PullRequestCard from "../cards/PullRequestCard";
import { useEffect, useState } from "react";
import { Props as PRProps } from "../cards/PullRequestCard";

const PullRequestList = () => {
  const [pullRequests, setPullRequests] = useState<PRProps[] | null>(null);

  useEffect(() => {
    fetch("http://localhost:3000/api/pulls")
      .then((res) => res.json())
      .then((data) => setPullRequests(data))
      .catch((err) => console.log(err));
  }, []);

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
