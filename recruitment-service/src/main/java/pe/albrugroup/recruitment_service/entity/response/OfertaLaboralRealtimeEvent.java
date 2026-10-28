package pe.albrugroup.recruitment_service.entity.response;

import lombok.Builder;
import lombok.Getter;
import pe.albrugroup.recruitment_service.entity.enums.EstadoOferta;

import java.time.Instant;

@Getter
@Builder
public class OfertaLaboralRealtimeEvent {

    private String tipo;
    private String origen;
    private Long idOfertaLaboral;
    private String codigo;
    private EstadoOferta estado;
    private Instant occurredAt;
}
