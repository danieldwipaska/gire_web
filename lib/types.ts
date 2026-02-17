export interface IUser {
  _id: string;
  name: string;
  email: string;
  image?: string;
  role: string;
  createdAt: string | Date;
}

export interface IIntegration {
  _id: string;
  userId: string;
  provider: string;
  githubUsername: string;
  accessToken?: string; // Optional because we might not send it to client
  lastSync: string | Date;
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
  updatedAt: string | Date;
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
  author: string;
  assignee: string | null;
  mergedAt: string | Date | null;
  updatedAt: string | Date;
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
