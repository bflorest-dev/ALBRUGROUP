package pe.albrugroup.schedule_service.entity.response.horario;

import lombok.*;
import pe.albrugroup.schedule_service.entity.enums.ModalidadContrato;

import java.time.LocalDate;
import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HorarioResponse {

    private Long id;
    private Long idEmpleado;
    private Long idContrato;
    private ModalidadContrato modalidad;
    private Integer horasObjetivoSemanal;
    private Integer horasObjetivoMensual;
    private Integer minutosAlmuerzo;
    private Integer minutosServicios;
    private LocalDate fechaInicio;
    private LocalDate fechaFin;
    private Boolean compensable;
    private List<HorarioDetalleResponse> detalles;
    private List<ExcepcionHorarioResponse> excepciones;
}
