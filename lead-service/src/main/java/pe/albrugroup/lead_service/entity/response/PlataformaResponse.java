package pe.albrugroup.lead_service.entity.response;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

@Getter
@Setter
@Builder
public class PlataformaResponse {

    private Long id;
    private String nombre;
    private Boolean activo;
    private Instant createdAt;
    private Instant updatedAt;
}
