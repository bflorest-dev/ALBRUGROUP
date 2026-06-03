package pe.albrugroup.lead_service.repository.projection;

import java.time.Instant;

public interface AsesorUltimoEventoProjection {

    Long getIdAsesor();
    Instant getUltimo();
}
