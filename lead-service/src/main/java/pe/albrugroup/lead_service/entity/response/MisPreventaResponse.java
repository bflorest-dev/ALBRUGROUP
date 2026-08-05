package pe.albrugroup.lead_service.entity.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import pe.albrugroup.lead_service.entity.enums.Etapa;
import pe.albrugroup.lead_service.entity.enums.Unidad;

import java.time.Instant;
import java.util.List;

/**
 * Vista de seguimiento de un cierre PREVENTA_COMPLETA / VENTA_CERRADA. Cada fila representa un
 * evento de cierre, no un lead unico: el mismo lead puede aparecer mas de una vez si fue cerrado
 * por asesores distintos en intentos diferentes.
 */
@Getter
@Builder
@AllArgsConstructor
public class MisPreventaResponse {

    private Long idEventoCierre;
    private Long idLead;
    private String prefijo;
    private String lead;
    private String usermeta;
    private String numeroDocumento;
    private String plan;
    private Integer internetVelocidad;
    private Unidad internetUnidad;
    private Integer velocidadPromocional;
    private Integer mesesPromocionVelocidad;
    private List<LeadAdicionalDetalleResponse> adicionales;
    private String departamento;
    private Instant fechaRegistro;
    private Etapa etapaActual;
    private String estado;
    private Instant fechaInstalacionRechazo;
    private String codigoTipificacion;
    private String codigoSubtipificacion;
}
