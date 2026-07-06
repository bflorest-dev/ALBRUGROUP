package pe.albrugroup.lead_service.entity.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import pe.albrugroup.lead_service.entity.enums.EstadoPostventa;
import pe.albrugroup.lead_service.entity.enums.Etapa;

import java.time.Instant;

/**
 * Vista delgada de un lead que el asesor paso a VENTA (tipificacion PREVENTA_COMPLETA /
 * subtipificacion VENTA_CERRADA). Expone su etapa actual y su ultima actualizacion para que
 * el asesor pueda dar seguimiento sin poder editar.
 */
@Getter
@Builder
@AllArgsConstructor
public class MisPreventaResponse {

    private Long id;
    private String prefijo;
    private String lead;
    private Etapa etapa;
    private EstadoPostventa estadoPostventa;
    private Instant updatedAt;
    private String codigoTipificacion;
    private String codigoSubtipificacion;
}
