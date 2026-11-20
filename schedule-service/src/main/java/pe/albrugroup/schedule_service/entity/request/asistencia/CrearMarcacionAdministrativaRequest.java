package pe.albrugroup.schedule_service.entity.request.asistencia;

import java.time.LocalDateTime;

/** Marcacion principal historica creada por administracion cuando no existia una marca real. */
public record CrearMarcacionAdministrativaRequest(
        LocalDateTime entrada,
        LocalDateTime salida,
        LocalDateTime almuerzoInicio,
        LocalDateTime almuerzoFin
) {
}
