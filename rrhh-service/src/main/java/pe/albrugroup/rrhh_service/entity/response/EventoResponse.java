package pe.albrugroup.rrhh_service.entity.response;

import lombok.*;
import pe.albrugroup.rrhh_service.entity.enums.EventoEmpleado;

import java.time.Instant;

@Builder
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class EventoResponse {

    private Long id;
    private Long empleadoId;
    private Long responsableId;
    private EventoEmpleado evento;
    private Instant fechaEvento;
    private Instant createdAt;
    private Instant updatedAt;
}
