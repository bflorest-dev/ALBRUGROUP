package pe.albrugroup.lead_service.entity.response;

import lombok.AllArgsConstructor;
import lombok.Getter;

/** Métricas GTR de PREVENTA agrupadas por proveedor de origen del lead. */
@Getter
@AllArgsConstructor
public class LeadGtrMetricasProveedorResponse {

    private final Long idProveedor;
    private final String nombreProveedor;
    private final long nuevos;
    private final long sinGestionar;
    private final long gestionados;
    private final long preventas;
    private final long ingresos;
}
