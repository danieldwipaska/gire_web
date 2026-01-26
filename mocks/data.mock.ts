export interface Integration {
  id: string;
  name: string;
  platform: string;
  status: 'connected' | 'disconnected' | 'pending';
  lastSync: Date;
  icon: string;
}

// Chart data for activity
export const mockActivityData = [
  { date: 'Jan 15', prs: 2, reviews: 3 },
  { date: 'Jan 16', prs: 1, reviews: 2 },
  { date: 'Jan 17', prs: 3, reviews: 4 },
  { date: 'Jan 18', prs: 2, reviews: 1 },
  { date: 'Jan 19', prs: 4, reviews: 5 },
  { date: 'Jan 20', prs: 1, reviews: 2 },
  { date: 'Jan 21', prs: 3, reviews: 3 },
];

export const mockIntegrations: Integration[] = [
  {
    id: 'int1',
    name: 'Google Sheets',
    platform: 'google',
    status: 'connected',
    lastSync: new Date('2026-01-21T16:00:00'),
    icon: 'Sheet',
  },
  {
    id: 'int2',
    name: 'Sentry',
    platform: 'sentry',
    status: 'connected',
    lastSync: new Date('2026-01-21T15:30:00'),
    icon: 'Bug',
  },
  {
    id: 'int3',
    name: 'Slack',
    platform: 'slack',
    status: 'pending',
    lastSync: new Date('2026-01-21T10:00:00'),
    icon: 'MessageSquare',
  },
  {
    id: 'int4',
    name: 'Jira',
    platform: 'jira',
    status: 'disconnected',
    lastSync: new Date('2026-01-20T12:00:00'),
    icon: 'Workflow',
  },
];
