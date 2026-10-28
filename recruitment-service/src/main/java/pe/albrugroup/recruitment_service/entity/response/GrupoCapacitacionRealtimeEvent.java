package pe.albrugroup.recruitment_service.entity.response;

import lombok.Builder;
import lombok.Getter;
import pe.albrugroup.recruitment_service.entity.enums.EstadoGrupoCapacitacion;

import java.time.Instant;

@Getter
@Builder
public class GrupoCapacitacionRealtimeEvent {

    private String tipo;
    private String origen;
    private Long idGrupoCapacitacion;
    private String codigo;
    private EstadoGrupoCapacitacion estado;
    private Instant occurredAt;
}
