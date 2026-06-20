package pe.albrugroup.lead_service.repository.projection;

import java.time.LocalTime;

public interface HoraProgramadaCantidadProjection {

    LocalTime getHoraProgramada();
    long getCantidad();
}
