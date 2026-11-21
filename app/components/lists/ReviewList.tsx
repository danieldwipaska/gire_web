"use client";

import { useMemo, useState } from "react";
import PullRequestCard from "../cards/PullRequestCard";
import ListContainer from "./ListContainer";
import CategoryFilterPills, {
  CategoryFilterValue,
} from "../buttons/CategoryFilterPills";
import { IIntegration, IProject, IPullRequest } from "@/lib/types";
import { buildCategoryMaps, matchesCategoryFilter } from "@/lib/utils";

const ReviewList = ({
  reviews,
  isLoading,
  projects = [],
  integrations = [],
}: {
  reviews: IPullRequest[];
  isLoading: boolean;
  projects?: IProject[];
  integrations?: IIntegration[];
}) => {
  const [categoryFilter, setCategoryFilter] =
    useState<CategoryFilterValue>("all");

  const filteredReviews = useMemo(() => {
    const { repoCategoriesMap, integrationCategoryMap } = buildCategoryMaps(
      projects,
      integrations,
    );
    return reviews.filter((pr) =>
      matchesCategoryFilter(
        pr,
        categoryFilter,
        repoCategoriesMap,
        integrationCategoryMap,
      ),
    );
  }, [reviews, categoryFilter, projects, integrations]);

  if (isLoading) {
    return (
      <div className="text-slate-400 text-sm py-4">Loading reviews...</div>
    );
  }

  return (
    <ListContainer
      title="PRs Needing Review"
      headerRight={
        <CategoryFilterPills
          value={categoryFilter}
          onChange={setCategoryFilter}
        />
      }
    >
      <div className="space-y-3 max-h-125 overflow-auto pr-2">
        {!filteredReviews || filteredReviews.length === 0 ? (
          <p className="text-slate-400 text-sm py-4">
            No PRs awaiting your review.
          </p>
        ) : (
          filteredReviews.map((pr) => (
            <PullRequestCard
              key={pr._id}
              title={pr.title}
              state={pr.state}
              repoName={pr.repoName}
              additions={pr.additions}
              deletions={pr.deletions}
              comments={pr.comments}
              url={pr.url}
              mergedAt={pr.mergedAt}
              updatedAt={pr.updatedAt}
              author={pr.author}
            />
          ))
        )}
      </div>
    </ListContainer>
  );
};

export default ReviewList;
