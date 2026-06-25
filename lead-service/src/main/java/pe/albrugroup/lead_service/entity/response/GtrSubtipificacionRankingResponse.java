package pe.albrugroup.lead_service.entity.response;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class GtrSubtipificacionRankingResponse {

    private String codigoSubtipificacion;
    private long cantidad;
    private double porcentaje;
}
