package pe.albrugroup.schedule_service.entity.response.asistencia;

import lombok.Builder;
import lombok.Getter;
import pe.albrugroup.schedule_service.entity.enums.EstadoAsistencia;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Builder
public class AttendanceRealtimeEvent {

    private String tipo;
    private String origen;
    private Long idEmpleado;
    private LocalDate fecha;
    private EstadoAsistencia estadoActual;
    private EstadoAsistencia estadoAnterior;
    private LocalDateTime desde;
    private Boolean tieneHorarioVigente;
    private Boolean laborableHoy;
    private Boolean esperadoHoy;
    private Boolean operativo;
    private Instant occurredAt;
}
