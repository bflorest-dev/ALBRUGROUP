package pe.albrugroup.rrhh_service.entity.request.postulante;

import lombok.*;
import pe.albrugroup.rrhh_service.entity.enums.ReclutamientoEstado;
import pe.albrugroup.rrhh_service.entity.enums.ReclutamientoSubEstado;

@Builder @Getter @Setter
@AllArgsConstructor @NoArgsConstructor
public class EstadoReclutamientoRequest {

    private ReclutamientoEstado estadoProceso;
    private ReclutamientoSubEstado subestadoProceso;
}
