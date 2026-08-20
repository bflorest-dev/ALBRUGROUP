package pe.albrugroup.lead_service.entity.response;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@Getter @Setter
@AllArgsConstructor
public class LeadGtrAgrupacionItemResponse {

    private Long idGrupo;
    private String codigoTipificacion;
    private String codigoSubtipificacion;
    private String etiqueta;
    private long cantidad;
    private boolean sinValor;
    private String valor;

    public LeadGtrAgrupacionItemResponse(
            Long idGrupo,
            String codigoTipificacion,
            String codigoSubtipificacion,
            String etiqueta,
            long cantidad,
            boolean sinValor
    ) {
        this(idGrupo, codigoTipificacion, codigoSubtipificacion, etiqueta, cantidad, sinValor, null);
    }
}
