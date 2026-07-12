package pe.albrugroup.lead_service.entity.response;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class LeadCampanaCorreccionResponse {

    private Long idLead;
    private String lead;
    private Long idCampanaAnterior;
    private String nombreCampanaAnterior;
    private Long idCampanaNueva;
    private String nombreCampanaNueva;
    private Long idEquipoAnterior;
    private Long idEquipoNuevo;
    private Integer eventosActualizados;
}
