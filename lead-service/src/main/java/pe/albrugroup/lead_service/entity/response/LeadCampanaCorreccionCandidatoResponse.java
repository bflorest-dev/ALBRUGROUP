package pe.albrugroup.lead_service.entity.response;

import lombok.Builder;
import lombok.Getter;
import pe.albrugroup.lead_service.entity.enums.EstadoSeguimiento;
import pe.albrugroup.lead_service.entity.enums.Etapa;

import java.time.Instant;

@Getter
@Builder
public class LeadCampanaCorreccionCandidatoResponse {

    private Long idLead;
    private String prefijo;
    private String lead;
    private String usermeta;
    private Etapa etapa;
    private EstadoSeguimiento estado;
    private Long idCampanaActual;
    private String nombreCampanaActual;
    private Long idEquipo;
    private String nombreAsesorAsignado;
    private Instant createdAt;
    private Instant updatedAt;
    private Long cantidadEventos;
}
