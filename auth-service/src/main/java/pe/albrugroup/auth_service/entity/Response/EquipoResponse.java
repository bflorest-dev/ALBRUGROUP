package pe.albrugroup.auth_service.entity.Response;

import lombok.*;

@Getter @Setter @Builder
@AllArgsConstructor @NoArgsConstructor
public class EquipoResponse {

    private Long id;
    private String nombre;
    private String descripcion;
    private Boolean activo;
}
