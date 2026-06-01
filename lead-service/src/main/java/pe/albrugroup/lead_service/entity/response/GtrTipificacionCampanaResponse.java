package pe.albrugroup.lead_service.entity.response;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class GtrTipificacionCampanaResponse {

    private Long idCampana;
    private String nombreCampana;
    private String codigoTipificacion;
    private String codigoSubtipificacion;
    private long cantidad;
    private double porcentaje;
}
