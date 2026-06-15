package pe.albrugroup.auth_service.entity.request;

import lombok.*;

@Getter @Setter @Builder
@AllArgsConstructor @NoArgsConstructor
public class EquipoActualizarRequest {

    private String nombre;
    private String descripcion;
    private Boolean activo;
}
