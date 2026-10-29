package pe.albrugroup.recruitment_service.entity.response;

import pe.albrugroup.recruitment_service.entity.enums.ModalidadContacto;

import java.time.LocalDateTime;

public record ContactoPostulacionResponse(
        ModalidadContacto modalidadContacto,
        LocalDateTime fechaHoraGestion
) {
}
