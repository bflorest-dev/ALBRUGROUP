package pe.albrugroup.recruitment_service.entity.response;

import pe.albrugroup.recruitment_service.entity.enums.Negocio;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public record SesionMeetResponse(
        Long id,
        Negocio negocio,
        LocalDate fecha,
        LocalDateTime fechaHoraInicio,
        Long horarioId,
        String horarioEtiqueta,
        String enlace,
        String estado,
        List<PostulacionResponse> postulaciones
) {
}
