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

// ================== PLAN ==================
export interface InternetConfig {
  velocidad: number;
  unidad: 'Mbps' | 'Gbps';
  tecnologia: 'HFC' | 'HPPT';
}

export interface TelefonConfig {
  minutos: number;
  descripcion: string;
}

export interface TeleviConfig {
  nombre: string;
  cantidadCanales: number;
}

export interface Plan extends BaseEntity {
  nombre: string;
  precio: number;
  vigenciaDesde: string; // YYYY-MM-DD
  vigenciaHasta: string; // YYYY-MM-DD
  internet: InternetConfig;
  television: TeleviConfig;
  telefono: TelefonConfig;
  activo: boolean;
}

// ================== PROMOCION ==================
export interface Promocion extends BaseEntity {
  nombre: string;
  tipo: 'INTERNO' | 'EXTERNO';
  zona: string;
  tipoVenta: 'NATURAL' | 'JURIDICA';
  descuento: boolean;
  porcentajeDescuento?: number; // Si descuento es true
  cantidadMeses: number;
  fechaInicio: string; // YYYY-MM-DD
  fechaFin: string; // YYYY-MM-DD
  activa: boolean;
}

// ================== ADICIONAL ==================
export interface Adicional extends BaseEntity {
  nombre: string;
  precioUnitario: number;
  activo: boolean;
}