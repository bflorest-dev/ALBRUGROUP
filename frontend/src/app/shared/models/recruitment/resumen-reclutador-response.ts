import { RecruitmentNegocio } from '../../../core/services/current-user-recruitment-negocio-scope.service';

export interface ResumenReclutadorResponse {
  negocio: RecruitmentNegocio;
  fechaReferencia: string;
  nuevosHoy: number;
  porContactar: number;
  sinContactoHoy: number;
  meetsProgramadas: number;
  aprobadosHoy: number;
  desaprobadosHoy: number;
}
