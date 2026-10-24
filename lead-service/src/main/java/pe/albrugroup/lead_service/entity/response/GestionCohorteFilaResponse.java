package pe.albrugroup.lead_service.entity.response;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDate;

@Getter
@Builder
public class GestionCohorteFilaResponse {

    private LocalDate mesCorteBase;
    private Integer numeroCorteBase;
    private Integer numeroFactura;
    private LocalDate fechaVencimiento;
    private long total;
    private long pagadoCliente;
    private long pagadoEmpresa;
    private long impagos;
    private long bajas;
}
