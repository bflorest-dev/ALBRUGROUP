package pe.albrugroup.lead_service.entity.response;

import lombok.Builder;

import java.time.LocalDate;
import java.util.List;

@Builder
public record ComisionVentaResponse(
        LocalDate mesComision,
        List<ComisionVentaCorteResponse> cortes
) {

    @Builder
    public record ComisionVentaCorteResponse(
            LocalDate mesCorteBase,
            Integer numeroCorteBase,
            String etiqueta,
            Integer mesAsistencia,
            Integer anioAsistencia,
            List<ComisionVentaAsesorResponse> asesores
    ) {}

    @Builder
    public record ComisionVentaAsesorResponse(
            Long idAsesor,
            String nombreAsesor,
            int ventasTotales,
            int ventasCorte,
            int ventasLima
    ) {}
}
