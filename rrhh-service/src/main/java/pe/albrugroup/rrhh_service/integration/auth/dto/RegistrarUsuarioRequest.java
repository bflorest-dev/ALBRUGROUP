package pe.albrugroup.rrhh_service.integration.auth.dto;

import lombok.*;
import pe.albrugroup.rrhh_service.entity.enums.PuestoTrabajo;

@Getter @Setter @Builder
@AllArgsConstructor @NoArgsConstructor
public class RegistrarUsuarioRequest {
    private Long empleadoId;
    private String nombres;
    private String apellidos;
    private String dni;
    private String email;
    private PuestoTrabajo puestoTrabajo;
}
