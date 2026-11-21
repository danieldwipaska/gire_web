"use client";

import { useMemo, useState } from "react";
import IssueCard from "../cards/IssueCard";
import ListContainer from "./ListContainer";
import CategoryFilterPills, {
  CategoryFilterValue,
} from "../buttons/CategoryFilterPills";
import { IIntegration, IIssue, IProject } from "@/lib/types";
import { buildCategoryMaps, matchesCategoryFilter } from "@/lib/utils";

const IssueList = ({
  issues,
  isLoading,
  projects = [],
  integrations = [],
}: {
  issues: IIssue[];
  isLoading: boolean;
  projects?: IProject[];
  integrations?: IIntegration[];
}) => {
  const [categoryFilter, setCategoryFilter] =
    useState<CategoryFilterValue>("all");

  const filteredIssues = useMemo(() => {
    const { repoCategoriesMap, integrationCategoryMap } = buildCategoryMaps(
      projects,
      integrations,
    );
    return issues.filter((issue) =>
      matchesCategoryFilter(
        issue,
        categoryFilter,
        repoCategoriesMap,
        integrationCategoryMap,
      ),
    );
  }, [issues, categoryFilter, projects, integrations]);

  if (isLoading) {
    return (
      <div className="text-slate-400 text-sm py-4">Loading issues...</div>
    );
  }

  return (
    <ListContainer
      title="Issues Assigned"
      headerRight={
        <CategoryFilterPills
          value={categoryFilter}
          onChange={setCategoryFilter}
        />
      }
    >
      <div className="space-y-3 max-h-125 overflow-auto pr-2">
        {!filteredIssues || filteredIssues.length === 0 ? (
          <p className="text-slate-400 text-sm py-4">
            No open issues assigned to you.
          </p>
        ) : (
          filteredIssues.map((issue: IIssue, index: number) => (
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
