package pe.albrugroup.schedule_service.entity.response.horario;

import lombok.*;

import java.time.LocalTime;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HorarioBasePeriodoResponse {
    private Boolean laborable;
    private LocalTime inicio;
    private LocalTime fin;
    private LocalTime almuerzoInicio;
    private LocalTime almuerzoFin;
}
