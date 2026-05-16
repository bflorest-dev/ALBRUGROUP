package pe.albrugroup.lead_service.entity.response;

import lombok.Builder;
import lombok.Getter;
import pe.albrugroup.lead_service.entity.enums.EstadoPostventa;
import pe.albrugroup.lead_service.entity.enums.EstadoSeguimiento;
import pe.albrugroup.lead_service.entity.enums.Etapa;

import java.time.Instant;

@Getter
@Builder
public class LeadRealtimeEvent {

    private String tipo;
    private Long idLead;
    private Etapa etapa;
    private Etapa etapaAnterior;
    private EstadoSeguimiento estado;
    private EstadoPostventa estadoPostventa;
    private Long idAsesorAsignado;
    private Long idAsesorAnterior;
    private String codigoTipificacion;
    private String codigoSubtipificacion;
    private Instant occurredAt;
}
