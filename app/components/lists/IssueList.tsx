"use client";

import IssueCard from "../cards/IssueCard";
import ListContainer from "./ListContainer";
import { useEffect, useState } from "react";
import { Props as IssueProps } from "../cards/IssueCard";

const IssueList = () => {
  const [issues, setIssues] = useState<IssueProps[]>([]);

  useEffect(() => {
    fetch("http://localhost:3000/api/issues")
      .then((res) => res.json())
      .then((data) => setIssues(data))
      .catch((err) => console.log(err));
  }, []);

  return (
    <>
      <ListContainer title="Your Issues">
        <div className="space-y-3 max-h-125 overflow-auto pr-2">
          {issues?.map((issue, index) => (
            <IssueCard
              key={index}
              title={issue.title}
              state={issue.state}
              repoName={issue.repoName}
              url={issue.url}
              updatedAt={issue.updatedAt}
            />
          ))}
        </div>
      </ListContainer>
    </>
  );
};

export default IssueList;
