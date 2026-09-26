package pe.albrugroup.lead_service.entity.request;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;
import pe.albrugroup.lead_service.entity.enums.CampoTipificacion;
import pe.albrugroup.lead_service.entity.enums.Etapa;

import java.time.LocalDate;
import java.util.List;

@Getter @Setter
public class BaseLeadsExportFilter {

    @NotNull
    private Etapa etapa;

    @NotNull
    private LocalDate desde;

    @NotNull
    private LocalDate hasta;

    private CampoTipificacion campoTipificacion = CampoTipificacion.ULTIMA;

    private Long idProveedorOrigen;

    private Long idProveedor;

    private List<String> codigosTipificacion;

    private List<String> codigosSubtipificacion;
}
