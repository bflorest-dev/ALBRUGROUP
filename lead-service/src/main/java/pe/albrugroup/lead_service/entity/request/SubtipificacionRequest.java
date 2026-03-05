package pe.albrugroup.lead_service.entity.request;

import lombok.*;

@Builder @Getter @Setter
@AllArgsConstructor @NoArgsConstructor
public class SubtipificacionRequest {

    private Long tipificacionId;
    private String codigo;
    private String descripcion;
    private Integer orden;
}
