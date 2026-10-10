package pe.albrugroup.schedule_service.entity.response.horario;

import lombok.*;

import java.time.LocalTime;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AlmuerzoPeriodoResponse {
    private LocalTime inicioBase;
    private LocalTime finBase;
    private LocalTime inicioEfectivo;
    private LocalTime finEfectivo;
    private Boolean modificado;
    private String fuente;
}
