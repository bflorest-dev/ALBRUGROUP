package pe.albrugroup.schedule_service.entity.request.horario;

import lombok.*;

import java.time.LocalDate;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CerrarHorarioEmpleadoRequest {
    private LocalDate fechaFin;
}
