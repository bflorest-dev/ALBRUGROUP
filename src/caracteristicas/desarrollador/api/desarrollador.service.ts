// DEPRECATED: types.ts no existe - tipos comentados para resolver TS2307
// import type { DeveloperUser, DeveloperDashboardData } from './types';

export const getDeveloperUser = async (id: string): Promise<any> => {
  // Mock implementation
  return {
    id,
    name: 'Developer User',
    email: 'dev@example.com',
    role: 'DESARROLLADOR',
    permissions: ['CODE_READ', 'CODE_WRITE'],
    techStack: ['React', 'TypeScript'],
    projects: ['Frontend App'],
  };
};

export const getDeveloperDashboardData = async (): Promise<any> => {
  // Mock implementation
  return {
    repositories: [
      {
        id: '1',
        name: 'frontend-repo',
        url: 'https://github.com/example/frontend',
        language: 'TypeScript',
        lastCommit: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
    pullRequests: [
      {
        id: '1',
        title: 'Add new feature',
        status: 'OPEN',
        author: 'dev1',
      },
    ],
    issues: [
      {
        id: '1',
        title: 'Bug fix needed',
        status: 'OPEN',
        assignee: 'dev1',
      },
    ],
  };
};