export interface UsuarioResponse {
  empleadoId: number;
  dni: string;
  nombreCompleto: string;
  username: string;
  activo: boolean;
  passwordInicializada: boolean;
  email: string;
  roles: string[];
  equipoIds?: number[];
}
