package pe.albrugroup.recruitment_service.entity.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ResumenSupervisorResponse {

    private long ingresosEsteMes;
    private long ingresosHoy;
    private long enProceso;
    private long nuevosSinGestion;
    private long sinContacto;
    private long enGestion;
    private long aprobadosEsteMes;
    private long desaprobadosEsteMes;
    private long enCapacitacion;
}
