package pe.albrugroup.schedule_service.entity.response.horario;

import lombok.*;

import java.time.LocalDate;
import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class JornadaEfectivaPeriodoResponse {
    private Long idEmpleado;
    private LocalDate desde;
    private LocalDate hasta;
    private List<JornadaEfectivaPeriodoDiaResponse> dias;
}
