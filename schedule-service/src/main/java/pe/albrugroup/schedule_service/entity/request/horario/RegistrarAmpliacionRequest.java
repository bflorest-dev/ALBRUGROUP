package pe.albrugroup.schedule_service.entity.request.horario;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalTime;

/**
 * Solicitud de ampliacion puntual de horario para un empleado.
 *
 * Reglas:
 * - {@code fecha} es opcional; si se omite, el backend usa el dia operativo actual (America/Lima).
 * - Debe enviarse al menos una de {@code horaEntrada} / {@code horaSalida}.
 * - El empleado que la registra se toma del token, no de este request.
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RegistrarAmpliacionRequest {

    /** Dia operativo de la ampliacion. Opcional: por defecto hoy (America/Lima). */
    private LocalDate fecha;

    /** Nueva hora de entrada adelantada respecto a la base (opcional). */
    private LocalTime horaEntrada;

    /** Nueva hora de salida extendida, o fin del tramo de reingreso (opcional). */
    private LocalTime horaSalida;

    @NotBlank(message = "motivo es obligatorio")
    private String motivo;
}
