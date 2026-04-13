/**
 * Contrato TypeScript para Proveedor
 * Alineado con: backend ProveedorResponse
 */

export interface Proveedor {
  id: number;
  nombre: string;
  activo: boolean;
  createdAt: string;
}

export interface CreateProveedorPayload {
  nombre: string;
}
