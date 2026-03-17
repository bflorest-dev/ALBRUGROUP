package pe.albrugroup.lead_service.entity.response;

import pe.albrugroup.lead_service.entity.enums.Base;
import pe.albrugroup.lead_service.entity.enums.EstadoSeguimiento;
import pe.albrugroup.lead_service.entity.enums.TipoDocumento;
import pe.albrugroup.lead_service.entity.enums.TipoDomicilio;
import pe.albrugroup.lead_service.entity.enums.TipoVia;

import java.math.BigDecimal;
import java.time.Instant;

public record LeadAsesorDetalleResponse(
        Long id,
        Instant fechaAsignacion,
        Instant lastEntryAt,
        String prefijo,
        String lead,
        String nombreCampana,
        String nombreProveedorCampana,
        Base base,
        EstadoSeguimiento estadoSeguimiento,
        Long idAsesorAsignado,
        String nombreAsesorAsignado,
        TipoDocumento tipoDocumento,
        String numeroDocumentoTitularServicio,
        String nombreTitular,
        String celularRegistro,
        String celularReferencia,
        String correo,
        String numeroDocumentoTitularCelularRegistro,
        String nombreTitularCelularRegistro,
        String ubigeo,
        TipoDomicilio tipoDomicilio,
        TipoVia tipoVia,
        String via,
        String direccion,
        String referencia,
        BigDecimal latitud,
        BigDecimal longitud,
        String urbanizacion,
        String numero,
        String manzana,
        String lote,
        String nombreEdificio,
        String nombreCondominio,
        String piso,
        String interior
) {
}
