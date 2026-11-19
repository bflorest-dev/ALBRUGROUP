package pe.albrugroup.rrhh_service.entity.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Builder
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class EmpleadoIdentidadResponse {

    private Long idEmpleado;
    private String nombres;
    private String apellidos;
}
