package pe.albrugroup.schedule_service.entity.response.horario;

import lombok.*;
import pe.albrugroup.schedule_service.entity.enums.EstadoAjusteJornada;
import pe.albrugroup.schedule_service.entity.enums.OrigenAjusteJornada;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AjusteJornadaResponse {
    private Long id;
    private Long idEmpleado;
    private Long idHorario;
    private LocalDate fecha;
    private LocalDateTime inicio;
    private LocalDateTime fin;
    private EstadoAjusteJornada estado;
    private OrigenAjusteJornada origen;
    private String motivo;
    private Long creadoPor;
    private Long reemplazadoPorId;
    private Instant createdAt;
}
