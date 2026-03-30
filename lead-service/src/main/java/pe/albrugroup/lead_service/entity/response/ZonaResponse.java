package pe.albrugroup.lead_service.entity.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ZonaResponse {

    private Long id;
    private String nombre;
    private Boolean activo;
    private Instant createdAt;
    private Instant updatedAt;
    private List<ZonaReglaResponse> reglas;
}
