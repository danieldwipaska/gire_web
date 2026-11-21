"use client";

import IssueList from "../lists/IssueList";
import PullRequestList from "../lists/PullRequestList";
import Tabs from "../Tabs";
import { IIntegration, IIssue, IProject, IPullRequest } from "@/lib/types";
import { useMemo, useState } from "react";

const TaskIndex = ({
  issues,
  pullRequests,
  projects = [],
  integrations = [],
}: {
  issues: IIssue[];
  pullRequests: IPullRequest[];
  projects?: IProject[];
  integrations?: IIntegration[];
}) => {
  const [selectedTab, setSelectedTab] = useState<string>("Today");

  const filteredPullRequests = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const lastMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    return pullRequests.filter((pr: IPullRequest) => {
      const updated = new Date(pr.updatedAt);
      if (selectedTab === "Today") return updated >= startOfToday;
      if (selectedTab === "Last Week") return updated >= lastWeek;
      if (selectedTab === "Last Month") return updated >= lastMonth;
      return true;
    });
  }, [pullRequests, selectedTab]);

  return (
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
          <PullRequestList
            pullRequests={filteredPullRequests}
            isLoading={false}
            projects={projects}
            integrations={integrations}
          />
        </div>
        <div className="col-span-1 md:col-span-2">
          <IssueList
            issues={issues}
            isLoading={false}
            projects={projects}
            integrations={integrations}
          />
        </div>
      </div>
    </div>
  );
};

export default TaskIndex;
