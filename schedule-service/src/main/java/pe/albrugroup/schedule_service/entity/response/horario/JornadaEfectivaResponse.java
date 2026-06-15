package pe.albrugroup.schedule_service.entity.response.horario;

import lombok.*;

import java.time.LocalDate;
import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class JornadaEfectivaResponse {
    private Long idEmpleado;
    private Long idHorario;
    private LocalDate fecha;
    private Boolean laborableBase;
    private List<TramoJornadaResponse> tramos;
    private TramoJornadaResponse tramoActual;
    private TramoJornadaResponse proximoTramo;
}
