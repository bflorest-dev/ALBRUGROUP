package pe.albrugroup.schedule_service.entity.response.horario;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HorarioMesResponse {

    private Long idEmpleado;
    private Integer anio;
    private Integer mes;
    private List<HorarioMesVigenciaResponse> vigencias;
}
