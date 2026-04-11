package pe.albrugroup.lead_service.entity.request;

import lombok.Builder;
import lombok.Getter;
import pe.albrugroup.lead_service.entity.enums.Accion;
import pe.albrugroup.lead_service.entity.enums.Etapa;

import java.time.LocalDate;

@Getter
@Builder
public class RegistrarEventoRequest {

    private Long idLead;
    private Long idCampana;
    private Accion accion;
    private Etapa etapa;
    private Long idAsesorAsignado;
    private String nombreAsesorAsignado;
    private String tipificacion;
    private String subtipificacion;
    private LocalDate fechaInstalacion;
    private String comentario;
}
