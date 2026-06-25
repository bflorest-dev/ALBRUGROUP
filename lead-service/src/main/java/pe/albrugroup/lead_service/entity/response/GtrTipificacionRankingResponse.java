package pe.albrugroup.lead_service.entity.response;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class GtrTipificacionRankingResponse {

    private String codigoTipificacion;
    private long cantidad;
    private double porcentaje;
}
