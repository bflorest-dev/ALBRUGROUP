package pe.albrugroup.lead_service.entity.response;

import java.time.Instant;

/** Progreso del backfill de LeadEtapaResumen, para el botón de reconstrucción en el panel ADMIN. */
public record BackfillEstadoResponse(
        boolean enEjecucion,
        int procesados,
        int total,
        Instant iniciadoEn,
        Instant finalizadoEn
) {
}
