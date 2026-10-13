package pe.albrugroup.schedule_service.entity.request.asistencia;

import java.util.List;

/** Solicitud administrativa para corregir uno o varios intervalos ya existentes. */
public record CorregirMarcacionesRequest(List<MarcacionPatchRequest> marcaciones) {
}
