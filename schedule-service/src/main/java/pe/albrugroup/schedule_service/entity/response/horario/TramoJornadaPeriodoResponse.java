package pe.albrugroup.schedule_service.entity.response.horario;

import lombok.*;
import pe.albrugroup.schedule_service.entity.enums.OrigenAjusteJornada;
import pe.albrugroup.schedule_service.entity.enums.RazonAjuste;

import java.time.LocalDateTime;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TramoJornadaPeriodoResponse {
    private Long idAjuste;
    private LocalDateTime inicio;
    private LocalDateTime fin;
    private OrigenAjusteJornada origen;
    private RazonAjuste razon;
    private Boolean esBaseEfectiva;
    private String motivo;
}
