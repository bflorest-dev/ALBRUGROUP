package pe.albrugroup.rrhh_service.entity.request.postulante;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import pe.albrugroup.rrhh_service.entity.enums.Evento;
import pe.albrugroup.rrhh_service.entity.enums.EtapaProceso;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

@Builder
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class RegistrarEventoPostulanteRequest {

    @NotNull private EtapaProceso etapaProceso;
    @NotNull private Evento evento;
    @NotBlank private String estado;
    private String subestado;

    // CAMPOS SITUACIONALES (opcionales)
    private Instant fechaEvento;
    private LocalDate inicioCapa;
    private LocalDate finCapa;
    private BigDecimal pagoDiaCapa;
}
