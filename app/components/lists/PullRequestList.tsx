"use client";

import { useMemo, useState } from "react";
import ListContainer from "./ListContainer";
import PullRequestCard from "../cards/PullRequestCard";
import CategoryFilterPills, {
  CategoryFilterValue,
} from "../buttons/CategoryFilterPills";
import { IIntegration, IProject, IPullRequest } from "@/lib/types";
import { buildCategoryMaps, matchesCategoryFilter } from "@/lib/utils";

const PullRequestList = ({
  pullRequests,
  isLoading,
  projects = [],
  integrations = [],
}: {
  pullRequests: IPullRequest[];
  isLoading: boolean;
  projects?: IProject[];
  integrations?: IIntegration[];
}) => {
  const [categoryFilter, setCategoryFilter] =
    useState<CategoryFilterValue>("all");

  const filteredPullRequests = useMemo(() => {
    const { repoCategoriesMap, integrationCategoryMap } = buildCategoryMaps(
      projects,
      integrations,
    );
    return pullRequests.filter((pr) =>
      matchesCategoryFilter(
        pr,
        categoryFilter,
        repoCategoriesMap,
        integrationCategoryMap,
      ),
    );
  }, [pullRequests, categoryFilter, projects, integrations]);

  if (isLoading) {
    return (
      <div className="text-slate-400 text-sm py-4">
        Loading pull requests...
      </div>
    );
  }

  return (
    <ListContainer
      title="My Pull Requests"
      headerRight={
        <CategoryFilterPills
          value={categoryFilter}
          onChange={setCategoryFilter}
        />
      }
    >
      <div className="space-y-3 max-h-125 overflow-auto pr-2">
        {!filteredPullRequests || filteredPullRequests.length === 0 ? (
          <p className="text-slate-400 text-sm py-4">
            No pull requests found.
          </p>
        ) : (
          filteredPullRequests.map((pullRequest: IPullRequest, index: number) => (
            <PullRequestCard
              key={pullRequest._id || index}
              title={pullRequest.title}
              state={pullRequest.state}
              repoName={pullRequest.repoName}
              additions={pullRequest.additions}
              deletions={pullRequest.deletions}
              comments={pullRequest.comments}
              url={pullRequest.url}
              updatedAt={pullRequest.updatedAt}
              mergedAt={pullRequest.mergedAt}
              author={pullRequest.author}
            />
          ))
        )}
      </div>
    </ListContainer>
  );
};

export default PullRequestList;
