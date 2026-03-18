package pe.albrugroup.rrhh_service.entity.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

@Builder @Getter @Setter
@AllArgsConstructor @NoArgsConstructor
public class EmpresaContratistaResponse {

    private Long id;
    private String nombre;
    private Boolean activo;
    private Instant createdAt;
}
