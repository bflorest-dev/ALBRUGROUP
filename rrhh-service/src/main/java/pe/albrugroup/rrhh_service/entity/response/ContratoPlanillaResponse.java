package pe.albrugroup.rrhh_service.entity.response;

import java.math.BigDecimal;
import java.time.LocalDate;

public record ContratoPlanillaResponse(
        Long idContrato,
        String modalidad,
        BigDecimal sueldoBasico,
        LocalDate fechaInicio,
        LocalDate fechaFin
) {
}
