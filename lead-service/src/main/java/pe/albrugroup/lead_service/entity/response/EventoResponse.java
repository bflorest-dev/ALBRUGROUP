package pe.albrugroup.lead_service.entity.response;

import lombok.Builder;
import lombok.Getter;
import pe.albrugroup.lead_service.entity.enums.Accion;
import pe.albrugroup.lead_service.entity.enums.Etapa;

import java.time.Instant;

@Getter
@Builder
public class EventoResponse {

    private Long id;
    private Long idLead;
    private Long idCampana;
    private Long idActor;
    private String nombreActor;
    private String rolActor;
    private Accion accion;
    private Etapa etapa;
    private String tipificacion;
    private String subtipificacion;
    private Instant createdAt;
}
