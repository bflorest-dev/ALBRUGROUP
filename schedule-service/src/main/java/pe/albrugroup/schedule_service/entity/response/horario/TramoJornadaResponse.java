package pe.albrugroup.schedule_service.entity.response.horario;

import lombok.*;
import pe.albrugroup.schedule_service.entity.enums.OrigenAjusteJornada;

import java.time.LocalDateTime;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TramoJornadaResponse {
    private Long idAjuste;
    private LocalDateTime inicio;
    private LocalDateTime fin;
    private OrigenAjusteJornada origen;
    private Boolean base;
    private String motivo;
}
