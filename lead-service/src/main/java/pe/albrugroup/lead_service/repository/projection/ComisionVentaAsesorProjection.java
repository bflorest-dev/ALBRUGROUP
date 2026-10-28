package pe.albrugroup.lead_service.repository.projection;

import java.time.LocalDate;

public interface ComisionVentaAsesorProjection {

    LocalDate getMesCorteBase();
    Integer getNumeroCorteBase();
    Long getIdAsesor();
    String getNombreAsesor();
    long getVentasTotales();
    long getVentasCorte();
    long getVentasLima();
}
