package pe.albrugroup.schedule_service.entity.response.asistencia;

import lombok.Builder;
import lombok.Getter;
import pe.albrugroup.schedule_service.entity.enums.TipoSesionEstado;

import java.time.LocalDateTime;

/** Una sesion de sub-estado del dia (SERVICIOS / PAUSA_ACTIVA / CAPACITACION) para el reporte. */
@Getter
@Builder
public class SesionEstadoResponse {
    private TipoSesionEstado tipo;
    private LocalDateTime inicio;
    private LocalDateTime fin;
    private Integer minutos;
    private Long creadoPor;
}
