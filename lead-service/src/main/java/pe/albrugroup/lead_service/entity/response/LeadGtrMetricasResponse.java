package pe.albrugroup.lead_service.entity.response;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class LeadGtrMetricasResponse {

    private long nuevos;
    private long sinGestionar;
    private long gestionados;
    private long preventas;
}
