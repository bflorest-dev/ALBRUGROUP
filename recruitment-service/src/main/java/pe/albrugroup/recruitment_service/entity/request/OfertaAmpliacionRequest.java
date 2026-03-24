package pe.albrugroup.recruitment_service.entity.request;

import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.*;

import java.time.LocalDate;

@Builder @Getter @Setter
@AllArgsConstructor @NoArgsConstructor
public class OfertaAmpliacionRequest {

    @NotNull @Positive private Integer cantidad;
    @NotNull @FutureOrPresent private LocalDate plazo;
}
