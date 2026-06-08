package pe.albrugroup.lead_service.entity.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import pe.albrugroup.lead_service.entity.enums.Accion;

import java.time.Instant;

/**
 * Vista delgada de un lead ingresado durante el día (evento ACCION = REGISTRO).
 * Une el evento con su lead para exponer el número de contacto en lugar del id técnico.
 */
@Getter
@Builder
@AllArgsConstructor
public class LeadDiarioResponse {

    private Long idLead;
    private String prefijo;
    private String lead;
    private String nombreActor;
    private String rolActor;
    private Accion accion;
    private Instant createdAt;
    private String nombreCampana;
    private String primeraCodigoTipificacion;
    private String primeraCodigoSubtipificacion;
    private String codigoTipificacion;
    private String codigoSubtipificacion;
}
