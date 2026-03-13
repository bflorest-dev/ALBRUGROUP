package pe.albrugroup.lead_service.entity.response;

import java.time.Instant;
import java.time.LocalDate;

public record PromocionComercialResponse(
        Long id,
        String nombre,
        Boolean interno,
        Long idProveedor,
        String nombreProveedor,
        Long idZona,
        String nombreZona,
        Boolean descuento,
        Integer cantidadMeses,
        LocalDate vigenciaDesde,
        LocalDate vigenciaHasta,
        Boolean activo,
        Instant createdAt
) {
}
