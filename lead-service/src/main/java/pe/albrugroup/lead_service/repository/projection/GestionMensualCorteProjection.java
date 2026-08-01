package pe.albrugroup.lead_service.repository.projection;

import java.time.LocalDate;

public interface GestionMensualCorteProjection {

    LocalDate getMesCorteBase();
    Integer getNumeroCorteBase();
    Integer getNumeroFactura();
    long getTotal();
    long getPagadoCliente();
    long getPagadoEmpresa();
    long getImpagos();
    long getBajas();
}
