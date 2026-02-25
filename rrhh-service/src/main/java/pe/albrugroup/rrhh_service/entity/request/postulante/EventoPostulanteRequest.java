package pe.albrugroup.rrhh_service.entity.request.postulante;

import jakarta.validation.constraints.NotNull;
import lombok.*;
import pe.albrugroup.rrhh_service.entity.enums.EventoPostulante;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

@Builder @Getter @Setter
@AllArgsConstructor @NoArgsConstructor
public class EventoPostulanteRequest {

    @NotNull private EventoPostulante evento;
    @NonNull private String estado;
    private String subestado;
    // OPCIONALES
    private Instant fechaEvento;
    private LocalDate inicioCapa;
    private LocalDate finCapa;
    private BigDecimal pagoDiaCapa;
}
