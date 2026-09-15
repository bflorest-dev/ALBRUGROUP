package pe.albrugroup.lead_service.entity.response;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class MisPreventasResumenResponse {

    private long preventas;           // leads que pasaron a VENTA en el período (fechaIngresoEtapa)
    private long registradas;         // leads que alcanzaron INGRESADO en el período (mayorRangoAt)
    private long instaladas;          // leads instalados en el período (fechaInstalacion)
    private long registradasEInstaladas; // registradas ∩ instaladas del mismo período
    private long rechazadas;          // del cohort preventas: volvió a PREVENTA o ultimaTipificacionOrden=1
}
