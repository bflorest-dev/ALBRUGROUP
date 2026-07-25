package pe.albrugroup.lead_service.entity.request;

import lombok.*;
import pe.albrugroup.lead_service.entity.enums.Etapa;

@Builder @Getter @Setter
@AllArgsConstructor @NoArgsConstructor
public class SubtipificacionRequest {

    private Long tipificacionId;
    private String codigo;
    private String descripcion;
    private Integer orden;
    private Etapa etapaCambio;
}
