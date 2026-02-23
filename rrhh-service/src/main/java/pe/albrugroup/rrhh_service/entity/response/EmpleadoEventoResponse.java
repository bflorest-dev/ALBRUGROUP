package pe.albrugroup.rrhh_service.entity.response;

import lombok.*;
import pe.albrugroup.rrhh_service.entity.enums.EventoEmpleado;

import java.time.Instant;

@Builder
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class EmpleadoEventoResponse {

    private Long id;
    private Long empleadoId;
    private Long responsableId;
    private EventoEmpleado evento;
    private String estado;
    private String subestado;
    private Instant fechaCreacion;
    private Instant fechaEvento;
}
