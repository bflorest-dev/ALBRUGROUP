package pe.albrugroup.lead_service.entity.response;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDate;

@Getter
@Builder
public class SubsanacionPreparacionResponse {
    private Long idLead;
    private Long idContacto;
    private Long idEquipo;
    private Long idCampana;
    private Long idProveedor;
    private Long idPlan;
    private LocalDate fechaInstalacionActual;
    private LeadDetalleResponse detalle;
    private ContactoClusterResponse contacto;
    private SubsanacionLeadBusquedaResponse impacto;
}
