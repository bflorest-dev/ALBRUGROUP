package pe.albrugroup.lead_service.entity.response;

import lombok.Builder;
import lombok.Getter;
import pe.albrugroup.lead_service.entity.enums.Accion;
import pe.albrugroup.lead_service.entity.enums.Etapa;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;

@Getter
@Builder
public class EventoResponse {

    private Long id;
    private Long idLead;
    private Long idCampana;
    private Long idActor;
    private String nombreActor;
    private String rolActor;
    private Long idAsesorAsignado;
    private String nombreAsesorAsignado;
    private Long idPlanOfrecido;
    private Accion accion;
    private Etapa etapa;
    private String tipificacion;
    private String subtipificacion;
    private LocalDate fechaInstalacion;
    private LocalDate fechaProgramacion;
    private String comentario;
    private LocalTime horaProgramada;
    private Instant createdAt;
}
