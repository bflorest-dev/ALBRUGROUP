package pe.albrugroup.lead_service.entity.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;
import pe.albrugroup.lead_service.entity.enums.Accion;

import java.time.Instant;

/**
 * Vista delgada de un lead ingresado durante el día (evento ACCION = REGISTRO).
 * Une el evento con su lead para exponer el número de contacto en lugar del id técnico.
 */
@Getter @Setter
@Builder
@AllArgsConstructor
public class LeadDiarioResponse {

    private Long idLead;
    private String prefijo;
    private String lead;
    private String usermeta;
    private String nombreActor;
    private String rolActor;
    private Accion accion;
    private Instant createdAt;
    private Long idEquipo;
    private String nombreCampana;
    private String primeraCodigoTipificacion;
    private String primeraCodigoSubtipificacion;
    private String mayorRangoCodigoTipificacion;
    private String mayorRangoCodigoSubtipificacion;
    private String codigoTipificacion;
    private String codigoSubtipificacion;
    private String ultimoNombreAsesorAsignado;
    private String ultimoNombreAsesorAsignacion;
    private Long totalAsignacionesDia;
    /** Cantidad de eventos REGISTRO del lead en el día operativo (>= 1). La fila representa el registro más temprano. */
    private Long totalRegistrosDia;
}
