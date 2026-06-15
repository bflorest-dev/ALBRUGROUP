package pe.albrugroup.schedule_service.entity.response.horario;

import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PreviewAjusteJornadaResponse {
    private Long idEmpleado;
    private LocalDateTime inicioSolicitado;
    private LocalDateTime finSolicitado;
    private LocalDateTime inicioAplicado;
    private LocalDateTime finAplicado;
    private String resultado;
    private String normalizacion;
    private List<Long> ajustesReemplazados;
    private JornadaEfectivaResponse jornadaAnterior;
    private JornadaEfectivaResponse jornadaResultante;
}
