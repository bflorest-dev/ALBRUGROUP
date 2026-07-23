package pe.albrugroup.lead_service.entity.request;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;
import pe.albrugroup.lead_service.entity.enums.EstadoPeriodoFacturacionPostventa;

@Getter
@Setter
public class CerrarPeriodoFacturacionRequest {

    @NotNull(message = "estado es obligatorio")
    private EstadoPeriodoFacturacionPostventa estado;

    private Boolean crearSiguientePeriodo;
    private String observacion;
}
