package pe.albrugroup.lead_service.repository.projection;

import java.time.LocalDate;

public interface ComisionVentaDetalleProjection {

    Long getIdLead();

    String getNumeroLead();

    String getNumeroDocumento();

    String getNombreCliente();

    LocalDate getFechaInstalacion();

    LocalDate getFechaVencimiento();

    LocalDate getFechaLimiteEfectiva();

    LocalDate getFechaPagoConsiderada();

    String getTipoVencimiento();

    String getEstadoPago();

    String getEstadoValidacion();

    String getMotivo();
}
