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
      if (selectedTab === "Last Week") return new Date(pr.updatedAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      if (selectedTab === "Last Month") return new Date(pr.updatedAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
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
              label: "Last Week",
              action: () => {
                setSelectedTab("Last Week");
              },
              isActive: selectedTab === "Last Week",
            },
            {
              label: "Last Month",
              action: () => {
                setSelectedTab("Last Month");
              },
              isActive: selectedTab === "Last Month",
            },
          ]}
        />

        {/* PR Items */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          <div className="col-span-1 md:col-span-3">
            <PullRequestList pullRequests={filteredPullRequests} isLoading={false} />
          </div>
          <div className="col-span-1 md:col-span-2">
            <IssueList issues={issues} isLoading={false} />
          </div>
        </div>
      </div>
    </>
  );
};

export default TaskIndex;
