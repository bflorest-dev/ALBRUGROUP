import type { User, BaseEntity } from '../../shared/types';

export interface AdminUser extends User {
  role: 'ADMINISTRADOR';
  adminLevel: 'SUPER' | 'STANDARD';
}

export interface AdminDashboardData extends BaseEntity {
  totalUsers: number;
  systemHealth: 'GOOD' | 'WARNING' | 'CRITICAL';
  recentActivities: Activity[];
}

export interface Activity {
  id: string;
  description: string;
  timestamp: Date;
  userId: string;
}