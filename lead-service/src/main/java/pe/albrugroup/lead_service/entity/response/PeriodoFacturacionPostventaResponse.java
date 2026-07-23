package pe.albrugroup.lead_service.entity.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import pe.albrugroup.lead_service.entity.enums.EstadoPeriodoFacturacionPostventa;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PeriodoFacturacionPostventaResponse {

    private Long id;
    private Long idCalendarioFacturacion;
    private Long idLead;
    private Integer numeroPeriodo;
    private LocalDate fechaInicioPeriodo;
    private LocalDate fechaFinPeriodo;
    private LocalDate fechaCorteEstimada;
    private LocalDate fechaEmisionEstimada;
    private LocalDate fechaEmisionConfirmada;
    private LocalDate fechaVencimientoEstimado;
    private LocalDate fechaVencimientoConfirmado;
    private BigDecimal montoEsperado;
    private BigDecimal montoProrrateo;
    private BigDecimal montoFacturado;
    private EstadoPeriodoFacturacionPostventa estado;
    private String observacion;
    private Instant createdAt;
    private Instant updatedAt;
}
