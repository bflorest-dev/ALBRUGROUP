package pe.albrugroup.recruitment_service.entity.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

public record MeetAsistenciaBatchItemRequest(
        @NotNull @Positive Long idPostulacion,
        @NotBlank String resultado,
        @Size(max = 2000) String observacion,
        @NotNull @PositiveOrZero Long revisionEsperada
) {
}
