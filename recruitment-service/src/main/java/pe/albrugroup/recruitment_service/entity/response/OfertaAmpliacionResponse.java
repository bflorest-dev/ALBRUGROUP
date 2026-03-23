package pe.albrugroup.recruitment_service.entity.response;

import lombok.*;

import java.time.Instant;
import java.time.LocalDate;

@Builder
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class OfertaAmpliacionResponse {

    private Integer cantidad;
    private LocalDate plazo;
    private Instant createdAt;
}
