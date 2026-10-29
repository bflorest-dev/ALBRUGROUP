package pe.albrugroup.recruitment_service.entity.response;
import java.time.LocalDateTime;
import java.util.List;
import pe.albrugroup.recruitment_service.entity.ActividadReclutamiento;
public record GestionReclutamientoResponse(
 PostulacionResponse postulacion, long revision, LocalDateTime evaluadaAt,
 LocalDateTime ultimaGestionAt, String ultimoResultado, String resultadoEvaluacion,
 List<String> accionesDisponibles, List<ActividadReclutamiento> actividades
) {}
