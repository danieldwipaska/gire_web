import IssueCard from "../cards/IssueCard";
import ListContainer from "./ListContainer";
import { IIssue } from "@/lib/types";

const IssueList = ({ issues, isLoading }: { issues: IIssue[]; isLoading: boolean }) => {
  if (isLoading) return <div>Loading...</div>;

  return (
    <>
      <ListContainer title="Your Issues">
        <div className="space-y-3 max-h-125 overflow-auto pr-2">
          {issues?.map((issue: IIssue, index: number) => (
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