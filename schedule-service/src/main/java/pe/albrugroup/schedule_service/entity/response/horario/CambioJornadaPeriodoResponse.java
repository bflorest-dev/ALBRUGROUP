package pe.albrugroup.schedule_service.entity.response.horario;

import lombok.*;
import pe.albrugroup.schedule_service.entity.enums.AlcanceDiaNoLaborable;
import pe.albrugroup.schedule_service.entity.enums.OrigenAjusteJornada;
import pe.albrugroup.schedule_service.entity.enums.RazonAjuste;
import pe.albrugroup.schedule_service.entity.enums.TipoDiaNoLaborable;
import pe.albrugroup.schedule_service.entity.enums.TipoExcepcionHorario;

import java.time.LocalDateTime;
import java.time.LocalTime;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CambioJornadaPeriodoResponse {
    private Long id;
    private String tipo;
    private String codigo;
    private String fuente;
    private LocalDateTime inicio;
    private LocalDateTime fin;
    private LocalTime almuerzoInicio;
    private LocalTime almuerzoFin;
    private Boolean laborable;
    private OrigenAjusteJornada origen;
    private RazonAjuste razon;
    private TipoExcepcionHorario tipoExcepcion;
    private TipoDiaNoLaborable tipoDiaNoLaborable;
    private AlcanceDiaNoLaborable alcance;
    private String motivo;
}
