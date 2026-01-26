import IssueCard from '../cards/IssueCard';
import ListContainer from './ListContainer';

const IssueList = () => {
  return (
    <>
      <ListContainer title="Your Issues">
        <div className="space-y-3 max-h-125 overflow-auto pr-2">
          <IssueCard />
          <IssueCard />
          <IssueCard />
          <IssueCard />
          <IssueCard />
          <IssueCard />
        </div>
      </ListContainer>
    </>
  );
};

export default IssueList;
