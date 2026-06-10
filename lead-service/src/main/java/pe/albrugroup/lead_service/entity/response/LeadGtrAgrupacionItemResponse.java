package pe.albrugroup.lead_service.entity.response;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class LeadGtrAgrupacionItemResponse {

    private Long idGrupo;
    private String codigoTipificacion;
    private String codigoSubtipificacion;
    private String etiqueta;
    private long cantidad;
    private boolean sinValor;
}
