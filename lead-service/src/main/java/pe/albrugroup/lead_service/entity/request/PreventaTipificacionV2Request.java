package pe.albrugroup.lead_service.entity.request;

import lombok.Getter;
import lombok.Setter;

/**
 * Contrato aislado del Drawer PREVENTA V2. El flag se procesa junto con la tipificación para que
 * el cierre de PREVENTA y la oportunidad encadenada compartan una única transacción.
 */
@Getter
@Setter
public class PreventaTipificacionV2Request extends LeadTipificacionRequest {
    private Boolean crearNuevaOportunidad;
}
