package pe.albrugroup.lead_service.entity.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.Set;

@Getter @Setter @Builder
@NoArgsConstructor @AllArgsConstructor
public class ProveedorResponse {

    private Long id;
    private String nombre;
    private Set<Integer> cortesFacturacion;
    private Integer mesesPermanencia;
    private Boolean activo;
    private Instant createdAt;
    private Boolean fallbackLeadSinCampana;
}
