package pe.albrugroup.auth_service.entity.Response;

import lombok.*;

@Getter @Setter @Builder
@AllArgsConstructor @NoArgsConstructor
public class EstadoAccesoResponse {
    private Boolean activo;
    private Boolean passwordInicializada;
    private String nombreCompleto;
}
