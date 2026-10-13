package pe.albrugroup.schedule_service.entity.request.asistencia;

import pe.albrugroup.schedule_service.entity.enums.TipoRegistroMarcacion;

import java.time.LocalDateTime;

/** Cambios parciales sobre una marcacion real existente. Un valor nulo conserva el valor actual. */
public record MarcacionPatchRequest(
        TipoRegistroMarcacion tipoRegistro,
        Long idRegistro,
        LocalDateTime entrada,
        LocalDateTime salida
) {
}
