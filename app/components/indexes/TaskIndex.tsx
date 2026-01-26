'use client';

import IssueList from '../Lists/IssueList';
import PullRequestList from '../Lists/PullRequestList';
import Tabs from '../Tabs';

const TaskIndex = () => {
  return (
    <>
      <div className="flex flex-col gap-6">
        <Tabs
          tabs={[
            {
              label: 'Today',
              action: () => {},
            },
            {
              label: 'This Week',
              action: () => {},
            },
            {
              label: 'This Month',
              action: () => {},
            },
          ]}
        />

        {/* PR Items */}
        <div className="flex gap-6">
          <div className="flex-2">
            <PullRequestList />
          </div>
          <div className="flex-1">
            <IssueList />
          </div>
        </div>
      </div>
    </>
  );
};

export default TaskIndex;
