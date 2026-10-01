package pe.albrugroup.billing_service.entity.response;

import pe.albrugroup.billing_service.entity.enums.ModalidadTrabajo;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public record MatrizPlanillaResponse(
        Long id,
        Integer version,
        boolean activa,
        BigDecimal bonoCapacitacion,
        String comentario,
        String creadoPor,
        Instant creadoAt,
        List<MatrizModalidadResponse> modalidades,
        List<MatrizTardanzaResponse> tardanzas
) {
    public record MatrizModalidadResponse(
            Long id,
            ModalidadTrabajo modalidad,
            Integer horasDia,
            BigDecimal bonoPuntualidad,
            Integer ventasMinimasProductividad,
            BigDecimal bonoProductividad
    ) {
    }

    public record MatrizTardanzaResponse(
            Long id,
            Integer minutosDesde,
            Integer minutosHasta,
            BigDecimal montoDescuento
    ) {
    }
}
