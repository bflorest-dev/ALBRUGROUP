package pe.albrugroup.lead_service.entity.response;

import pe.albrugroup.lead_service.entity.enums.Etapa;
import pe.albrugroup.lead_service.entity.enums.TipoDocumento;
import pe.albrugroup.lead_service.entity.enums.TipoFechaRelevanteVenta;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;

/**
 * Fila del detalle (Tabla 4) del resumen diario de VENTA: los datos de un lead ingresado, listos para mostrar.
 * {@code fechaRelevante}/{@code horaRelevante}/{@code fechaRelevanteAt}/{@code tipoFechaRelevante} ya vienen
 * resueltos segun el comportamiento de la tipificacion (prioridad PROGRAMACION -> RECHAZO -> INSTALACION ->
 * TIPIFICACION); {@code departamento}/{@code distrito} ya vienen resueltos desde el ubigeo.
 * {@code clasificacion} es el bucket de la Tabla 2 (RETORNO / SIN_GESTIONAR / codigo de tipificacion).
 */
public record VentaResumenDiarioDetalle(
        int orden,
        Long idLead,
        String lead,
        Instant fechaIngresoEtapa,
        String ultimaCodigoTipificacion,
        String ultimaCodigoSubtipificacion,
        String asesorMerito,
        String asesorUltimaGestion,
        LocalDate fechaRelevante,
        LocalTime horaRelevante,
        Instant fechaRelevanteAt,
        TipoFechaRelevanteVenta tipoFechaRelevante,
        String comentario,
        TipoDocumento tipoDocumento,
        String numeroDocumento,
        String nombreCliente,
        String celularRegistro,
        String celularReferencia,
        String departamento,
        String distrito,
        String ubigeo,
        Etapa etapaActual,
        String clasificacion
) {
}
