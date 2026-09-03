/**
 * Resumen mensual CERRADO de un empleado (snapshot inmutable de un mes pasado). Hechos balanceados, sin
 * dinero. `balanceFinal` es el déficit no compensado (<= 0); `minutosExtra` y `minutosCompensados` van
 * aparte del balance. Solo existe para meses pasados; el mes en curso se deriva del detalle diario.
 */
export interface ResumenMensualResponse {
  idEmpleado: number;
  anio: number;
  mes: number;
  fechaCierre: string | null;

  diasLaborables: number;
  diasPresente: number;
  diasTardanza: number;
  diasTardanzaCompensable: number;
  diasTardanzaJustificada: number;
  diasFalta: number;

  minutosObjetivo: number;
  minutosTrabajados: number;
  balanceFinal: number;
  minutosExtra: number;
  minutosCompensados: number;
  cantidadTardanzas: number;
}
