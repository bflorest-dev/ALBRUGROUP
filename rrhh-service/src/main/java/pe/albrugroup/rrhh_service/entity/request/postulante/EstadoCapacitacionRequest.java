package pe.albrugroup.rrhh_service.entity.request.postulante;

import lombok.*;
import pe.albrugroup.rrhh_service.entity.enums.CapacitacionEstado;
import pe.albrugroup.rrhh_service.entity.enums.CapacitacionSubEstado;

@Builder @Getter @Setter
@AllArgsConstructor @NoArgsConstructor
public class EstadoCapacitacionRequest {

    private Long id;
    private CapacitacionEstado  estadoProceso;
    private CapacitacionSubEstado subestadoProceso;
}
