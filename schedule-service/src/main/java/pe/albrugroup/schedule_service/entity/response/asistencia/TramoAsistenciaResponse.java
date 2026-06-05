package pe.albrugroup.schedule_service.entity.response.asistencia;

import lombok.*;
import pe.albrugroup.schedule_service.entity.enums.OrigenTramo;

import java.time.LocalTime;

/**
 * Un tramo trabajado dentro de un mismo dia. Solo se llena en dias partidos (jornada reabierta
 * por una ampliacion); en dias normales el detalle del dia usa la entrada/salida unica y esta
 * lista queda vacia.
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TramoAsistenciaResponse {

    private OrigenTramo origen;
    private LocalTime horaEntradaEstablecida;
    private LocalTime horaSalidaEstablecida;
    private LocalTime horaEntradaAsistencia;
    private LocalTime horaSalidaAsistencia;
    private Integer minutosObjetivo;
    private Integer minutosTrabajados;
    private String motivo;
    private Long creadoPor;
}
