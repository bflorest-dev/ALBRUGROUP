// DEPRECATED: types.ts no existe - tipos comentados para resolver TS2307
// import type { AdminUser, AdminDashboardData } from './types';

export const getAdminUser = async (id: string): Promise<any> => {
  // Mock implementation
  return {
    id,
    name: 'Admin User',
    email: 'admin@example.com',
    role: 'ADMINISTRADOR',
    permissions: ['READ', 'WRITE', 'DELETE'],
    adminLevel: 'SUPER',
  };
};

export const getAdminDashboardData = async (): Promise<any> => {
  // Mock implementation
  return {
    id: '1',
    createdAt: new Date(),
    updatedAt: new Date(),
    totalUsers: 150,
    systemHealth: 'GOOD',
    recentActivities: [
      {
        id: '1',
        description: 'User login',
        timestamp: new Date(),
        userId: 'user1',
      },
    ],
  };
};