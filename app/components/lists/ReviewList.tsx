import PullRequest from '@/models/PullRequest';
import { cache } from 'react';
import PullRequestCard from '../cards/PullRequestCard';
import ListContainer from './ListContainer';
import connectDB from '@/lib/mongodb';


const getFilterDate = cache(() => new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));

const ReviewList = async () => {
  await connectDB();
  // Server Component to get PRs that mentioned user
  const prs = await PullRequest.find({
    updatedAt: {
      $gte: getFilterDate(),
    },
    $or: [
      { reviewRequested: true },
      { mentionedInDescription: true },
    ],
  }).sort("-updatedAt").lean();
  
  return (
    <ListContainer title="PRs Needing Review">
      <div className="space-y-3 max-h-125 overflow-auto pr-2">
        {prs.map((pr) => (
          <PullRequestCard key={pr._id} title={pr.title} state={pr.state} repoName={pr.repoName} additions={pr.additions} deletions={pr.deletions} comments={pr.comments} url={pr.url} mergedAt={pr.mergedAt} updatedAt={pr.updatedAt} />
        ))}
      </div>
    </ListContainer>
  );
};

export default ReviewList;
