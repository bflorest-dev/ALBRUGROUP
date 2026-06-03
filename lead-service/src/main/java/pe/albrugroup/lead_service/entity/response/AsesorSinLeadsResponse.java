package pe.albrugroup.lead_service.entity.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

@Getter @Setter @Builder
@NoArgsConstructor @AllArgsConstructor
public class AsesorSinLeadsResponse {

    private Long idAsesor;
    private Instant sinLeadsDesde;
}
