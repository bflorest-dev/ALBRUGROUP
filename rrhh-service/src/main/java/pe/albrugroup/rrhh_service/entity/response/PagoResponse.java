package pe.albrugroup.rrhh_service.entity.response;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Builder @Getter @Setter
@AllArgsConstructor @NoArgsConstructor
public class PagoResponse {

    private Long id;
    private Long idContrato;
    // PERIODO
    private LocalDate fechaInicio;
    private LocalDate fechaFin;
    // ABONO
    private BigDecimal sueldoBase;
    private BigDecimal asignacionFamiliar;
    private BigDecimal bonoPuntualidad;
    private BigDecimal comisionSemanal;
    private BigDecimal comisionMensual;
    private BigDecimal bonoExtra;
    private BigDecimal sueldoTotal;
}
