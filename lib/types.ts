export interface IUser {
  _id: string;
  name: string;
  email: string;
  image?: string;
  role: 'super_user' | 'member' | 'user' | string;
  workspaceId?: string | null;
  activeWorkspaceId?: string | null;
  createdAt: string | Date;
}

export interface IWorkspace {
  _id: string;
  name: string;
  description?: string;
  ownerId: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface IIntegration {
  _id: string;
  userId: string;
  provider: string;
  label?: string;
  githubUsername: string;
  accessToken?: string; // Optional because we might not send it to client
  lastSync: string | Date;
  lastFullSync?: string | Date;
  status: 'active' | 'expired';
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface IIssue {
  _id: string;
  githubId: number;
  title: string;
  state: string;
  repoName: string;
  url: string;
  mentionedInDescription: boolean;
  author: string;
  assignee: string | null;
  assignees?: string[];
  githubCreatedAt?: string | Date;
  closedAt?: string | Date | null;
  updatedAt: string | Date;
  integrationId?: string;
  userId: string;
}

export interface IPullRequest {
  _id: string;
  githubId: number;
  title: string;
  state: string;
  repoName: string;
  additions: number;
  deletions: number;
  changedFiles: number;
  comments: number;
  url: string;
  mentionedInDescription: boolean;
  reviewRequested: boolean;
  reviewedByMe?: boolean;
  author: string;
  assignee: string | null;
  githubCreatedAt?: string | Date;
  closedAt?: string | Date | null;
  mergedAt: string | Date | null;
  updatedAt: string | Date;
  integrationId?: string;
  userId: string;
}

export interface IDashboardData {
  integrations: IIntegration[];
  issues: IIssue[];
  pullRequests: IPullRequest[];
  userPullRequests: IPullRequest[];
  myPRsThisMonthCount: number;
  todayStats: {
    merged: number;
    open: number;
    closed: number;
    total: number;
  };
  reviews: IPullRequest[];
  chartData: {
    date: string;
    prs: number;
    reviews: number;
  }[];
}

export interface ICodeChurnData {
  day: string;
  additions: number;
  deletions: number;
  changedFiles: number;
  rawDate: string;
}

export interface ITaskChartData {
  name: string;
  value: number;
  fraction: number;
  color: string;
}

export interface IMergedPRData {
  week: string;
  merged: number;
  rawDate: number;
}

export interface IActivityData {
  repo: string;
  prs: number;
  issues: number;
  merged: number;
}

export type ActivityEventType =
  | "pr_created"
  | "pr_updated"
  | "pr_reviewed"
  | "pr_commented"
  | "pr_merged"
  | "pr_closed"
  | "issue_opened"
  | "issue_closed"
  | "issue_commented"
  | "pushed";

export interface IActivityEvent {
  _id: string;
  userId: string;
  githubEventId: string;
  type: ActivityEventType;
  rawType?: string;
  action?: string;
  actor?: string;
  repoName: string;
  targetType: "pr" | "issue" | "push";
  targetNumber?: number;
  title: string;
  description?: string;
  url: string;
  occurredAt: string | Date;
}

export interface IGitHubComment {
  id: number;
  user: string;
  avatarUrl?: string;
  body: string;
  createdAt: string;
  kind: "comment" | "review";
  reviewState?: string;
}

export interface IGitHubPRFile {
  filename: string;
  status: string;
  additions: number;
  deletions: number;
  changes: number;
  patch?: string;
}

export interface IGitHubCheckRun {
  id: number;
  name: string;
  status: string;
  conclusion: string | null;
  htmlUrl?: string;
}

export interface IGitHubDetail {
  kind: "pr" | "issue";
  repo: string;
  number: number;
  title: string;
  body: string;
  state: string;
  merged: boolean;
  draft?: boolean;
  url: string;
  author: string;
  authorAvatar?: string;
  createdAt: string;
  updatedAt: string;
  mergedAt?: string | null;
  closedAt?: string | null;
  labels: { name: string; color: string }[];
  assignees: string[];
  requestedReviewers?: string[];
  headBranch?: string;
  baseBranch?: string;
  additions?: number;
  deletions?: number;
  changedFiles?: number;
  mergeable?: boolean | null;
  mergeableState?: string;
  comments: IGitHubComment[];
  files?: IGitHubPRFile[];
  checks?: IGitHubCheckRun[];
}

export type ProjectCategory = "office" | "freelance" | "personal";
export type ProjectStatus = "active" | "on_hold" | "completed" | "archived";

export interface IFigmaLink {
  _id?: string;
  title: string;
  url: string;
  kind: "design" | "prototype";
}

export interface IProjectMember {
  userId: string;
  role: "owner" | "member";
  name?: string;
  email?: string;
}

export interface IProject {
  _id: string;
  name: string;
  description?: string;
  category: ProjectCategory;
  clientOrTeam?: string;
  status: ProjectStatus;
  color?: string;
  ownerId: string;
  members: IProjectMember[];
  repos: string[];
  figmaLinks: IFigmaLink[];
  createdAt?: string | Date;
  updatedAt?: string | Date;
  stats?: {
    openPRs: number;
    openIssues: number;
    mergedPRs: number;
  };
}

export interface INoteUser {
  _id: string;
  name: string;
  email: string;
}

export interface INote {
  _id: string;
  userId: string;
  authorName?: string;
  projectId?: string | null;
  projectName?: string | null;
  title: string;
  content: string;
  tags: string[];
  sharedWith: string[];
  isPinned: boolean;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export type TaskStatus = "todo" | "in_progress" | "in_review" | "done";
export type TaskPriority = "low" | "medium" | "high" | "urgent";

export interface ITask {
  _id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string | Date | null;
  createdBy: string;
  createdByName?: string;
  assignedTo: string;
  assignedToName?: string;
  assignedToEmail?: string;
  projectId?: string | null;
  projectName?: string | null;
  sourceNoteId?: string | null;
  sourceNoteTitle?: string | null;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}



