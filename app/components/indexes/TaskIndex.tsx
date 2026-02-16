"use client";

import IssueList from "../lists/IssueList";
import PullRequestList from "../lists/PullRequestList";
import Tabs from "../Tabs";
import { Props as IssueProps } from "../cards/IssueCard";
import { Props as PRProps } from "../cards/PullRequestCard";
import { useEffect, useState } from "react";

const TaskIndex = ({
  issues,
  pullRequests,
}: {
  issues: IssueProps[];
  pullRequests: PRProps[];
}) => {
  const [filteredPullRequests, setFilteredPullRequests] = useState<PRProps[]>([]);
  const [selectedTab, setSelectedTab] = useState<string>("Today");

  useEffect(() => {
    const selectedPullRequests = pullRequests.filter((pr: PRProps) => {
      if (selectedTab === "Today") return new Date(pr.updatedAt) > new Date(Date.now() - 24 * 60 * 60 * 1000);
      if (selectedTab === "This Week") return new Date(pr.updatedAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      if (selectedTab === "This Month") return new Date(pr.updatedAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    });
    setFilteredPullRequests(selectedPullRequests);
  }, [selectedTab]);

  return (
    <>
      <div className="flex flex-col gap-6">
        <Tabs 
          tabs={[
            {
              label: "Today",
              action: () => {
                setSelectedTab("Today");
              },
              isActive: selectedTab === "Today",
            },
            {
              label: "This Week",
              action: () => {
                setSelectedTab("This Week");
              },
              isActive: selectedTab === "This Week",
            },
            {
              label: "This Month",
              action: () => {
                setSelectedTab("This Month");
              },
              isActive: selectedTab === "This Month",
            },
          ]}
        />

        {/* PR Items */}
        <div className="grid grid-cols-5 gap-6">
          <div className="col-span-3">
            <PullRequestList pullRequests={filteredPullRequests} isLoading={false} />
          </div>
          <div className="col-span-2">
            <IssueList issues={issues} isLoading={false} />
          </div>
        </div>
      </div>
    </>
  );
};

export default TaskIndex;
