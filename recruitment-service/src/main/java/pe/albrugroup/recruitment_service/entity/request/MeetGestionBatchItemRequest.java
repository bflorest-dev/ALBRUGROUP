package pe.albrugroup.recruitment_service.entity.request;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

public record MeetGestionBatchItemRequest(
        @NotNull @Positive Long idPostulacion,
        @Size(max = 20) String asistencia,
        @Size(max = 20) String evaluacion,
        @Size(max = 100) String motivo,
        @Size(max = 2000) String observacion,
        @NotNull @PositiveOrZero Long revisionEsperada
) {
}
