"use client";

import { useMemo, useState } from "react";
import {
  Activity,
  Check,
  CircleDot,
  Copy,
  ExternalLink,
  GitBranch,
  GitCommit,
  GitMerge,
  GitPullRequest,
  GitPullRequestClosed,
  MessageSquare,
  Search,
  ShieldCheck,
} from "lucide-react";
import { ActivityEventType, IActivityEvent, IProject, IPullRequest } from "@/lib/types";
import { toLocalDateKey } from "@/lib/dates";
import { getTimeAgo, isAnyUser, parseGitHubUrl } from "@/lib/utils";
import SyncButton from "../buttons/SyncButton";
import SummaryCard from "../cards/SummaryCard";
import PullRequestCard from "../cards/PullRequestCard";
import ContextFilterDropdown from "../dropdowns/ContextFilterDropdown";
import { useDetailDrawer } from "../drawer/DetailDrawerProvider";

type TimeFilter = "today" | "yesterday" | "this-week" | "this-month" | "all";
type CategoryFilter =
  | "all"
  | "created"
  | "updated"
  | "reviewed"
  | "merged"
  | "closed"
  | "issues";
type ViewMode = "timeline" | "prs";

const TYPE_META: Record<
  ActivityEventType,
  { label: string; badgeClass: string; icon: typeof GitPullRequest }
> = {
  pr_created: {
    label: "PR Created",
    badgeClass: "bg-brand-violet/12 text-brand-violet border-brand-violet/25",
    icon: GitPullRequest,
  },
  pr_updated: {
    label: "PR Updated",
    badgeClass: "bg-brand-blue/15 text-brand-blue-ink border-brand-blue/30",
    icon: GitPullRequest,
  },
  pr_reviewed: {
    label: "PR Reviewed",
    badgeClass: "bg-brand-orchid/15 text-brand-orchid-ink border-brand-orchid/30",
    icon: ShieldCheck,
  },
  pr_commented: {
    label: "PR Commented",
    badgeClass: "bg-card text-ink border-canvas",
    icon: MessageSquare,
  },
  pr_merged: {
    label: "PR Merged",
    badgeClass: "bg-brand-mint/25 text-brand-mint-ink border-brand-mint/50",
    icon: GitMerge,
  },
  pr_closed: {
    label: "PR Closed",
    badgeClass: "bg-rose-100 text-rose-700 border-rose-200",
    icon: GitPullRequestClosed,
  },
  issue_opened: {
    label: "Issue Opened",
    badgeClass: "bg-brand-blue/15 text-brand-blue-ink border-brand-blue/30",
    icon: CircleDot,
  },
  issue_closed: {
    label: "Issue Closed",
    badgeClass: "bg-brand-mint/25 text-brand-mint-ink border-brand-mint/50",
    icon: CircleDot,
  },
  issue_commented: {
    label: "Issue Comment",
    badgeClass: "bg-card text-ink border-canvas",
    icon: MessageSquare,
  },
  pushed: {
    label: "Commit Pushed",
    badgeClass: "bg-brand-mint/25 text-brand-mint-ink border-brand-mint/50",
    icon: GitCommit,
  },
};

const matchesCategory = (type: ActivityEventType, category: CategoryFilter) => {
  if (category === "all") return true;
  if (category === "created") return type === "pr_created";
  if (category === "updated") return type === "pr_updated" || type === "pushed";
  if (category === "reviewed")
    return type === "pr_reviewed" || type === "pr_commented";
  if (category === "merged") return type === "pr_merged";
  if (category === "closed") return type === "pr_closed";
  if (category === "issues")
    return (
      type === "issue_opened" ||
      type === "issue_closed" ||
      type === "issue_commented"
    );
  return true;
};

const formatGroupHeading = (dateKey: string) => {
  const now = new Date();
  const todayKey = toLocalDateKey(now);
  const yesterday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() - 1,
  );
  const yesterdayKey = toLocalDateKey(yesterday);

  if (dateKey === todayKey) return "Today";
  if (dateKey === yesterdayKey) return "Yesterday";

  const [y, m, d] = dateKey.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

export default function ActivityClient({
  events,
  pullRequests,
  githubUsernames,
  projects,
}: {
  events: IActivityEvent[];
  pullRequests: IPullRequest[];
  githubUsernames: string[];
  projects: IProject[];
}) {
  const { openDetailByUrl } = useDetailDrawer();
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("today");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("timeline");
  const [search, setSearch] = useState("");
  const [copied, setCopied] = useState(false);

  const timeBounds = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );
    const startOfYesterday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() - 1,
    );
    const day = startOfToday.getDay() || 7;
    const startOfWeek = new Date(startOfToday);
    if (day !== 1) startOfWeek.setDate(startOfWeek.getDate() - (day - 1));
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    return { startOfToday, startOfYesterday, startOfWeek, startOfMonth };
  }, []);

  const isInTimeFilter = (dateInput: string | Date) => {
    const d = new Date(dateInput);
    if (timeFilter === "today") return d >= timeBounds.startOfToday;
    if (timeFilter === "yesterday") {
      return d >= timeBounds.startOfYesterday && d < timeBounds.startOfToday;
    }
    if (timeFilter === "this-week") return d >= timeBounds.startOfWeek;
    if (timeFilter === "this-month") return d >= timeBounds.startOfMonth;
    return true;
  };

  const eventsInRange = useMemo(() => {
    const q = search.trim().toLowerCase();
    return events.filter((ev) => {
      if (!isInTimeFilter(ev.occurredAt)) return false;
      if (q) {
        const hay = `${ev.title} ${ev.repoName} ${ev.description || ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [events, timeFilter, search, timeBounds]);

  const filteredEvents = useMemo(() => {
    return eventsInRange.filter((ev) => matchesCategory(ev.type, categoryFilter));
  }, [eventsInRange, categoryFilter]);

  const groupedEvents = useMemo(() => {
    const map = new Map<string, IActivityEvent[]>();
    for (const ev of filteredEvents) {
      const key = toLocalDateKey(ev.occurredAt);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(ev);
    }
    return Array.from(map.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  }, [filteredEvents]);

  const touchedPRs = useMemo(() => {
    const prByUrl = new Map<string, IPullRequest>();
    for (const pr of pullRequests) {
      prByUrl.set(pr.url, pr);
    }

    const touchedMap = new Map<
      string,
      { pr: IPullRequest; actions: Set<ActivityEventType>; lastTouchedAt: Date }
    >();

    for (const ev of filteredEvents) {
      if (ev.targetType !== "pr") continue;
      const existingPr = prByUrl.get(ev.url);
      const fallbackPr: IPullRequest = existingPr || {
        _id: ev._id,
        githubId: ev.targetNumber || 0,
        title: ev.title,
        state:
          ev.type === "pr_merged" || ev.type === "pr_closed" ? "closed" : "open",
        repoName: ev.repoName,
        additions: 0,
        deletions: 0,
        changedFiles: 0,
        comments: 0,
        url: ev.url,
        mentionedInDescription: false,
        reviewRequested: false,
        author: ev.actor || githubUsernames[0] || "",
        assignee: null,
        mergedAt: ev.type === "pr_merged" ? ev.occurredAt : null,
        updatedAt: ev.occurredAt,
        userId: ev.userId,
      };

      const evDate = new Date(ev.occurredAt);
      if (!touchedMap.has(ev.url)) {
        touchedMap.set(ev.url, {
          pr: fallbackPr,
          actions: new Set([ev.type]),
          lastTouchedAt: evDate,
        });
      } else {
        const entry = touchedMap.get(ev.url)!;
        entry.actions.add(ev.type);
        if (evDate > entry.lastTouchedAt) entry.lastTouchedAt = evDate;
      }
    }

    const q = search.trim().toLowerCase();
    for (const pr of pullRequests) {
      if (!isAnyUser(pr.author, githubUsernames)) continue;
      if (!isInTimeFilter(pr.updatedAt)) continue;
      if (q && !`${pr.title} ${pr.repoName}`.toLowerCase().includes(q)) continue;

      const inferredType: ActivityEventType = pr.mergedAt
        ? "pr_merged"
        : pr.state === "closed"
          ? "pr_closed"
          : pr.githubCreatedAt &&
              toLocalDateKey(pr.githubCreatedAt) === toLocalDateKey(pr.updatedAt)
            ? "pr_created"
            : "pr_updated";

      if (!matchesCategory(inferredType, categoryFilter)) continue;

      if (!touchedMap.has(pr.url)) {
        touchedMap.set(pr.url, {
          pr,
          actions: new Set([inferredType]),
          lastTouchedAt: new Date(pr.updatedAt),
        });
      }
    }

    return Array.from(touchedMap.values()).sort(
      (a, b) => b.lastTouchedAt.getTime() - a.lastTouchedAt.getTime(),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredEvents, pullRequests, githubUsernames, timeFilter, categoryFilter, search]);

  const stats = useMemo(() => {
    let created = 0;
    let updated = 0;
    let reviewed = 0;
    let mergedOrClosed = 0;

    for (const ev of eventsInRange) {
      if (ev.type === "pr_created") created++;
      else if (ev.type === "pr_updated" || ev.type === "pushed") updated++;
      else if (ev.type === "pr_reviewed" || ev.type === "pr_commented") reviewed++;
      else if (ev.type === "pr_merged" || ev.type === "pr_closed") mergedOrClosed++;
    }

    return { created, updated, reviewed, mergedOrClosed };
  }, [eventsInRange]);

  const handleCopyStandup = async () => {
    const labelMap: Record<TimeFilter, string> = {
      today: "Today",
      yesterday: "Yesterday",
      "this-week": "This Week",
      "this-month": "This Month",
      all: "Recent Activity",
    };

    const lines: string[] = [`**GitHub Activity (${labelMap[timeFilter]})**`];
    if (touchedPRs.length > 0) {
      lines.push("", "Pull Requests:");
      for (const { pr, actions } of touchedPRs) {
        const actionLabels = Array.from(actions)
          .map((a) => TYPE_META[a]?.label || a)
          .join(", ");
        lines.push(`- [${pr.repoName}] ${pr.title} (${actionLabels}) - ${pr.url}`);
      }
    }

    const otherEvents = filteredEvents.filter((e) => e.targetType !== "pr");
    if (otherEvents.length > 0) {
      lines.push("", "Other Updates:");
      for (const ev of otherEvents.slice(0, 15)) {
        lines.push(`- [${ev.repoName}] ${ev.title} (${TYPE_META[ev.type].label})`);
      }
    }

    if (lines.length === 1) {
      lines.push("- No recorded GitHub activity for this period.");
    }

    await navigator.clipboard.writeText(lines.join("\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen container">
      {/* Header */}
      <div className="relative z-40 flex flex-col md:flex-row gap-4 md:gap-0 justify-between items-start md:items-center animate-fade-up">
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-bold text-ink tracking-tight">Activity</h2>
          <p className="text-sm text-ink-muted">
            Track every PR you created, updated, reviewed, merged, or closed
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <ContextFilterDropdown projects={projects} />
          <button
            type="button"
            onClick={handleCopyStandup}
            className="px-4 py-2 bg-card hover:bg-highlight border border-line rounded-full text-xs font-semibold text-ink transition-all flex items-center gap-2 cursor-pointer shadow-[0_2px_8px_rgba(28,28,31,0.04)]"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-brand-mint-ink" />
                Copied Standup
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-brand-violet" />
                Copy Standup
              </>
            )}
          </button>
          <SyncButton />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 my-6">
        <SummaryCard
          title="PRs Created"
          desc="Opened in selected period"
          value={stats.created}
          icon={
            <div className="w-9 h-9 bg-brand-violet/12 border border-brand-violet/20 rounded-2xl flex items-center justify-center">
              <GitPullRequest className="w-4 h-4 text-brand-violet" />
            </div>
          }
        />
        <SummaryCard
          title="Updates & Pushes"
          desc="PR edits & commits pushed"
          value={stats.updated}
          icon={
            <div className="w-9 h-9 bg-brand-blue/15 border border-brand-blue/25 rounded-2xl flex items-center justify-center">
              <Activity className="w-4 h-4 text-brand-blue-ink" />
            </div>
          }
        />
        <SummaryCard
          title="Reviews & Comments"
          desc="Feedback & review activity"
          value={stats.reviewed}
          icon={
            <div className="w-9 h-9 bg-brand-orchid/15 border border-brand-orchid/25 rounded-2xl flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-brand-orchid-ink" />
            </div>
          }
        />
        <SummaryCard
          title="Merged & Closed"
          desc="Completed or closed PRs"
          value={stats.mergedOrClosed}
          icon={
            <div className="w-9 h-9 bg-brand-mint/25 border border-brand-mint/40 rounded-2xl flex items-center justify-center">
              <GitMerge className="w-4 h-4 text-brand-mint-ink" />
            </div>
          }
        />
      </div>

      {/* Controls */}
      <div className="bg-card border border-line rounded-3xl p-4 mb-6 space-y-4 shadow-[0_2px_12px_rgba(28,28,31,0.04)]">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Time Filter */}
          <div className="flex flex-wrap items-center gap-1 bg-canvas p-1 border border-line rounded-full w-fit">
            {(
              [
                { value: "today", label: "Today" },
                { value: "yesterday", label: "Yesterday" },
                { value: "this-week", label: "This Week" },
                { value: "this-month", label: "This Month" },
                { value: "all", label: "All Synced" },
              ] as const
            ).map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setTimeFilter(opt.value)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  timeFilter === opt.value
                    ? "bg-highlight text-ink shadow-xs"
                    : "text-ink-muted hover:text-ink"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* View Mode + Search */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-3.5 h-3.5 text-ink-subtle absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Filter by repo or title..."
                className="w-full pl-9 pr-3.5 py-2 bg-highlight border border-line rounded-full text-xs text-ink placeholder-ink-subtle focus:outline-none focus:bg-white focus:border-brand-violet"
              />
            </div>

            <div className="flex items-center gap-1 bg-canvas p-1 border border-line rounded-full">
              <button
                type="button"
                onClick={() => setViewMode("timeline")}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  viewMode === "timeline"
                    ? "bg-highlight text-ink shadow-xs"
                    : "text-ink-muted hover:text-ink"
                }`}
              >
                Timeline ({filteredEvents.length})
              </button>
              <button
                type="button"
                onClick={() => setViewMode("prs")}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  viewMode === "prs"
                    ? "bg-highlight text-ink shadow-xs"
                    : "text-ink-muted hover:text-ink"
                }`}
              >
                PRs Touched ({touchedPRs.length})
              </button>
            </div>
          </div>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-line">
          {(
            [
              { value: "all", label: "All Actions" },
              { value: "created", label: "Created" },
              { value: "updated", label: "Updated / Pushed" },
              { value: "reviewed", label: "Reviewed / Commented" },
              { value: "merged", label: "Merged" },
              { value: "closed", label: "Closed" },
              { value: "issues", label: "Issues" },
            ] as const
          ).map((cat) => (
            <button
              key={cat.value}
              type="button"
              onClick={() => setCategoryFilter(cat.value)}
              className={`px-3 py-1 rounded-full text-xs font-semibold border transition-colors cursor-pointer ${
                categoryFilter === cat.value
                  ? "bg-ink text-white border-ink"
                  : "bg-highlight text-ink-muted border-line hover:text-ink"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {viewMode === "timeline" ? (
        groupedEvents.length === 0 ? (
          <div className="bg-card border border-line rounded-3xl p-10 text-center space-y-2 shadow-[0_2px_12px_rgba(28,28,31,0.04)]">
            <p className="text-ink font-bold">
              No recorded activity in this range
            </p>
            <p className="text-xs text-ink-muted">
              Try clicking Sync Now to pull your latest GitHub events, or switch the time range.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {groupedEvents.map(([dateKey, dayEvents]) => (
              <div key={dateKey} className="space-y-3">
                <div className="flex items-center gap-3">
                  <h3 className="text-sm font-bold text-ink">
                    {formatGroupHeading(dateKey)}
                  </h3>
                  <span className="text-xs text-ink-muted font-medium">
                    {dayEvents.length} {dayEvents.length === 1 ? "event" : "events"}
                  </span>
                  <div className="flex-1 h-px bg-line" />
                </div>

                <div className="space-y-2.5">
                  {dayEvents.map((ev) => {
                    const meta = TYPE_META[ev.type] || TYPE_META.pr_updated;
                    const Icon = meta.icon;
                    const canOpenDrawer = Boolean(parseGitHubUrl(ev.url));

                    return (
                      <div
                        key={ev._id || ev.githubEventId}
                        onClick={() => {
                          if (canOpenDrawer) {
                            openDetailByUrl(ev.url);
                          } else {
                            window.open(ev.url, "_blank", "noopener,noreferrer");
                          }
                        }}
                        className="bg-card border border-line rounded-2xl p-4 hover:border-brand-violet/45 hover:bg-highlight hover:-translate-y-0.5 hover:shadow-[0_10px_24px_rgba(28,28,31,0.06)] transition-all cursor-pointer flex items-start gap-3"
                      >
                        <div className="w-9 h-9 rounded-xl bg-highlight border border-line flex items-center justify-center shrink-0">
                          <Icon className="w-4 h-4 text-brand-violet" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <p className="text-sm font-bold text-ink truncate">
                              {ev.title}
                            </p>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border whitespace-nowrap ${meta.badgeClass}`}
                              >
                                {meta.label}
                              </span>
                              <a
                                href={ev.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="p-1.5 rounded-full text-ink-muted hover:text-ink hover:bg-card"
                                title="Open on GitHub"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            </div>
                          </div>

                          {ev.description && (
                            <p className="text-xs text-ink-muted mb-2 line-clamp-2">
                              {ev.description}
                            </p>
                          )}

                          <div className="flex items-center gap-2 text-xs text-ink-muted">
                            <span className="flex items-center gap-1 text-ink font-medium">
                              <GitBranch className="w-3 h-3 text-ink-muted" />
                              {ev.repoName}
                            </span>
                            {ev.targetNumber && (
                              <>
                                <span>•</span>
                                <span>#{ev.targetNumber}</span>
                              </>
                            )}
                            <span>•</span>
                            <span suppressHydrationWarning>
                              {getTimeAgo(ev.occurredAt)}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )
      ) : touchedPRs.length === 0 ? (
        <div className="bg-card border border-line rounded-3xl p-10 text-center space-y-2 shadow-[0_2px_12px_rgba(28,28,31,0.04)]">
          <p className="text-ink font-bold">
            No pull requests touched in this range
          </p>
          <p className="text-xs text-ink-muted">
            Click Sync Now or adjust your filters to see PRs you created, updated, reviewed, or closed.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {touchedPRs.map(({ pr, actions }) => (
            <div key={pr.url} className="space-y-1.5">
              <div className="flex flex-wrap gap-1.5 px-1">
                {Array.from(actions).map((act) => (
                  <span
                    key={act}
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${
                      TYPE_META[act]?.badgeClass || ""
                    }`}
                  >
                    {TYPE_META[act]?.label || act}
                  </span>
                ))}
              </div>
              <PullRequestCard
                title={pr.title}
                state={pr.state}
                repoName={pr.repoName}
                additions={pr.additions}
                deletions={pr.deletions}
                comments={pr.comments}
                url={pr.url}
                updatedAt={pr.updatedAt}
                mergedAt={pr.mergedAt}
                author={pr.author}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
