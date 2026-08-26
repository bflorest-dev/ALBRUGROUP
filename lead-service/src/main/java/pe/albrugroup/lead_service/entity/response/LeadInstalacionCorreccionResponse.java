package pe.albrugroup.lead_service.entity.response;

import lombok.Builder;
import lombok.Getter;
import pe.albrugroup.lead_service.entity.enums.Etapa;

import java.time.LocalDate;

@Getter
@Builder
public class LeadInstalacionCorreccionResponse {

    private Long idLead;
    private String lead;
    private Etapa etapa;
    private String secAnterior;
    private String secNuevo;
    private String sotAnterior;
    private String sotNuevo;
    private LocalDate fechaInstalacionAnterior;
    private LocalDate fechaInstalacionNueva;
    private Long idEventoInstalado;
}
