package pe.albrugroup.lead_service.repository.projection;

import java.time.LocalDate;

public interface GestionCohorteCorteProjection {

    LocalDate getMesCorteBase();
    Integer getNumeroCorteBase();
    Integer getNumeroFactura();
    LocalDate getFechaVencimiento();
    long getTotal();
    long getPagadoCliente();
    long getPagadoEmpresa();
    long getImpagos();
    long getBajas();
}
