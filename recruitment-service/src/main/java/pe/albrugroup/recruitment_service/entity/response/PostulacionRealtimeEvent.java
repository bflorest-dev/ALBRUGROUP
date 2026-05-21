package pe.albrugroup.recruitment_service.entity.response;

import lombok.Builder;
import lombok.Getter;
import pe.albrugroup.recruitment_service.entity.enums.EstadoBandejaPostulacion;
import pe.albrugroup.recruitment_service.entity.enums.EstadoPostulacion;
import pe.albrugroup.recruitment_service.entity.enums.Etapa;
import pe.albrugroup.recruitment_service.entity.enums.PuestoObjetivo;

import java.time.Instant;

@Getter
@Builder
public class PostulacionRealtimeEvent {

    private String tipo;
    private String origen;
    private Long idPostulacion;
    private Etapa etapa;
    private Etapa etapaAnterior;
    private EstadoPostulacion estado;
    private EstadoPostulacion estadoAnterior;
    private EstadoBandejaPostulacion estadoBandeja;
    private EstadoBandejaPostulacion estadoBandejaAnterior;
    private Long idGrupoCapacitacion;
    private PuestoObjetivo puestoObjetivo;
    private Instant occurredAt;
}
