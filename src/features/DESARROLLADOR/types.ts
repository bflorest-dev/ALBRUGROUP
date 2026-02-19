import type { User, BaseEntity } from '../../shared/types';

export interface DeveloperUser extends User {
  role: 'DESARROLLADOR';
  techStack: string[];
  projects: string[];
}

export interface CodeRepository extends BaseEntity {
  name: string;
  url: string;
  language: string;
  lastCommit: Date;
}

export interface DeveloperDashboardData {
  repositories: CodeRepository[];
  pullRequests: PullRequest[];
  issues: Issue[];
}

export interface PullRequest {
  id: string;
  title: string;
  status: 'OPEN' | 'CLOSED' | 'MERGED';
  author: string;
}

export interface Issue {
  id: string;
  title: string;
  status: 'OPEN' | 'CLOSED';
  assignee: string;
}