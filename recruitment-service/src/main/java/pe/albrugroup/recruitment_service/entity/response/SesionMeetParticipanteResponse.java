package pe.albrugroup.recruitment_service.entity.response;

import java.time.LocalDateTime;

public record SesionMeetParticipanteResponse(
        Long idPostulacion,
        PostulacionResponse postulacion,
        String asistencia,
        String resultadoEvaluacion,
        LocalDateTime evaluadaAt,
        Long responsableId,
        Long revision
) {
}
