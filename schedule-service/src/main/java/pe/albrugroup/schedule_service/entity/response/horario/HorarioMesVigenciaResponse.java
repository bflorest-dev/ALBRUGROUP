package pe.albrugroup.schedule_service.entity.response.horario;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import pe.albrugroup.schedule_service.entity.enums.ModalidadContrato;

import java.time.LocalDate;
import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HorarioMesVigenciaResponse {

    private Long idHorario;
    private ModalidadContrato modalidad;
    private Integer horasObjetivoSemanal;
    private Integer horasObjetivoMensual;
    private Integer minutosAlmuerzo;
    private Integer minutosServicios;
    private LocalDate fechaInicio;
    private LocalDate fechaFin;
    private LocalDate desdeAplicacion;
    private LocalDate hastaAplicacion;
    private Boolean compensable;
    private List<HorarioDetalleResponse> detallesBase;
    private List<ExcepcionHorarioResponse> modificaciones;
}
