package pe.albrugroup.lead_service.entity.response;

import pe.albrugroup.lead_service.entity.enums.Etapa;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;

/**
 * Fila UNIFICADA del detalle (drill-down) de cualquier contador del dashboard de VENTA. Superset de campos
 * (todos nullable): la misma fila sirve a Preventas, Registradas, Instaladas, ranking, tramos, etc. — solo
 * cambia el anclaje/predicado del contador, no las columnas. El frontend decide qué mostrar (oculta columnas
 * vacías; {@code idLead}/{@code lead} viajan siempre para poder buscar aunque no se muestren).
 *
 * <p>El orden de los campos calza con la proyección {@code SELECT new ...} de {@code VentaDetalleQueryRepository}.</p>
 */
public record VentaDetalleResponse(
        Long idLead,
        String lead,
        String usermeta,
        String numeroDocumento,
        String nombreCliente,
        Etapa etapa,
        String tipificacion,
        String subtipificacion,
        Instant fechaIngresoEtapa,
        Instant fechaUltimaGestion,
        LocalDate fechaProgramacion,
        LocalTime horaProgramada,
        LocalDate fechaInstalacion,
        LocalDate fechaRechazo,
        String asesorMerito,
        String asesorUltimaGestion,
        String ultimoComentario,
        String ubigeo,
        BigDecimal cargoFijo
) {
}
