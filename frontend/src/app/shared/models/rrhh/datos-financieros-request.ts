export interface DatosFinancierosRequest {
  banco: string;
  cuentaBancaria: string;
  cuentaInterbancaria: string;
  cuentaPropia: boolean;
  parentesco?: string | null;
  celularTransferencia?: string | null;
  idEmpresaContratista?: number | null;
}
