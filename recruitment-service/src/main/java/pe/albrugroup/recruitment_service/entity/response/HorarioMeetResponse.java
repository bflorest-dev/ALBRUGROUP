package pe.albrugroup.recruitment_service.entity.response;

import pe.albrugroup.recruitment_service.entity.enums.Negocio;

import java.time.LocalTime;

public record HorarioMeetResponse(
        Long id,
        Negocio negocio,
        String codigo,
        String etiqueta,
        LocalTime horaInicio
) {
}
