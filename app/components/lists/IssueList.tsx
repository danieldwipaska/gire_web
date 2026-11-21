import IssueCard from "../cards/IssueCard";
import ListContainer from "./ListContainer";
import { IIssue } from "@/lib/types";

const IssueList = ({ issues, isLoading }: { issues: IIssue[]; isLoading: boolean }) => {
  if (isLoading) return <div className="text-slate-400 text-sm py-4">Loading issues...</div>;

  return (
    <ListContainer title="Your Issues">
      <div className="space-y-3 max-h-125 overflow-auto pr-2">
        {!issues || issues.length === 0 ? (
          <p className="text-slate-400 text-sm py-4">No open issues assigned to you.</p>
        ) : (
          issues.map((issue: IIssue, index: number) => (
            <IssueCard
              key={issue._id || index}
              title={issue.title}
              state={issue.state}
              repoName={issue.repoName}
              url={issue.url}
              updatedAt={issue.updatedAt}
            />
          ))
        )}
      </div>
    </ListContainer>
  );
};

export default IssueList;
