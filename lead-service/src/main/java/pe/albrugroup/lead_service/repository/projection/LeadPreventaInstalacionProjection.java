package pe.albrugroup.lead_service.repository.projection;

import pe.albrugroup.lead_service.entity.enums.Etapa;
import pe.albrugroup.lead_service.entity.enums.EstadoClientePostventa;
import pe.albrugroup.lead_service.entity.enums.TipoDocumento;
import pe.albrugroup.lead_service.entity.enums.TipoReglaFacturacion;

import java.time.Instant;
import java.time.LocalDate;

public interface LeadPreventaInstalacionProjection {

    Long getIdLead();

    String getPrefijo();

    String getLead();

    TipoDocumento getTipoDocumento();

    String getNumeroDocumento();

    String getNombreCliente();

    String getDepartamento();

    Long getIdAsesorPreventa();

    String getNombreAsesorPreventa();

    Long getIdProveedor();

    String getProveedor();

    TipoReglaFacturacion getReglaSemanaProveedor();

    Instant getFechaPreventa();

    LocalDate getFechaInstalacion();

    EstadoClientePostventa getEstadoPostventa();

    Etapa getEtapaActual();
}
