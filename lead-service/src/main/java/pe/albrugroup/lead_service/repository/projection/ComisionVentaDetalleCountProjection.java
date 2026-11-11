package pe.albrugroup.lead_service.repository.projection;

public interface ComisionVentaDetalleCountProjection {

    long getTotalLeads();

    long getTotalValidas();

    long getTotalNoValidas();
}
