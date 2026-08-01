package pe.albrugroup.lead_service.entity.response;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDate;

@Getter
@Builder
public class GestionMensualFilaResponse {

    private LocalDate mesCorteBase;
    private Integer numeroCorteBase;
    private Integer numeroFactura;
    private String etiqueta;
    private long total;
    private long pagadoCliente;
    private long pagadoEmpresa;
    private long impagos;
    private long bajas;
}
