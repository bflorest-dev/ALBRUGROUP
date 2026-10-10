package pe.albrugroup.schedule_service.entity.response.horario;

import lombok.*;

import java.time.LocalDate;
import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class JornadaEfectivaPeriodoDiaResponse {
    private LocalDate fecha;
    private Boolean esHoy;
    private Long idHorario;
    private String estado;
    private HorarioBasePeriodoResponse horarioBase;
    private JornadaPeriodoEfectivaResponse jornadaEfectiva;
    private AlmuerzoPeriodoResponse almuerzo;
    private List<CambioJornadaPeriodoResponse> cambios;
}
