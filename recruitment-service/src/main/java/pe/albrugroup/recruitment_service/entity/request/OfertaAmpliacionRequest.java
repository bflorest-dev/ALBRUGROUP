package pe.albrugroup.recruitment_service.entity.request;

import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.LocalDate;

@Builder @Getter @Setter
@AllArgsConstructor @NoArgsConstructor
public class OfertaAmpliacionRequest {

    @NotNull private Integer cantidad;
    @NotNull private LocalDate plazo;
}
