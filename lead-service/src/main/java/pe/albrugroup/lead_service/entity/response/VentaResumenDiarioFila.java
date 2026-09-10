package pe.albrugroup.lead_service.entity.response;

import pe.albrugroup.lead_service.entity.enums.Etapa;
import pe.albrugroup.lead_service.entity.enums.TipoDocumento;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;

/**
 * Proyeccion cruda de una fila del cohorte de "ventas ingresadas" (una por lead que entro a VENTA en el
 * periodo). El orden de los campos calza con la proyeccion {@code SELECT new ...} de
 * {@link pe.albrugroup.lead_service.repository.VentaResumenDiarioQueryRepository}. El servicio la transforma
 * en {@link VentaResumenDiarioDetalle} (resuelve fecha relevante + departamento/distrito) y deriva los
 * contadores y desgloses.
 */
public record VentaResumenDiarioFila(
        Long idLead,
        String lead,
        Etapa etapaActual,
        String ultimaCodigoTipificacion,
        String ultimaCodigoSubtipificacion,
        Integer ultimaTipificacionOrden,
        Integer mayorRangoOrden,
        Instant fechaIngresoEtapa,
        Long idAsesorMerito,
        String nombreAsesorMerito,
        String nombreAsesorUltimaGestion,
        String comentario,
        TipoDocumento tipoDocumento,
        String numeroDocumento,
        String nombreCliente,
        String celularRegistro,
        String celularReferencia,
        LocalDate fechaProgramacion,
        LocalTime horaProgramada,
        LocalDate fechaRechazo,
        LocalDate fechaInstalacion,
        Instant fechaTipificacion,
        String ubigeo
) {
}
