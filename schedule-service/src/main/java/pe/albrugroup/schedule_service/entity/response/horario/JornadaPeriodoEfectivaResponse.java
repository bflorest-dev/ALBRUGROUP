package pe.albrugroup.schedule_service.entity.response.horario;

import lombok.*;

import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class JornadaPeriodoEfectivaResponse {
    private Boolean laborable;
    private List<TramoJornadaPeriodoResponse> tramos;
}
