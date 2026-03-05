package pe.albrugroup.lead_service.entity.request;

import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import lombok.*;
import pe.albrugroup.lead_service.entity.enums.Etapa;

@Builder @Getter @Setter
@AllArgsConstructor @NoArgsConstructor
public class TipificacionRequest {

    @Enumerated(EnumType.STRING)
    private Etapa etapa;
    private String codigo;
    private String descripcion;
    private Integer orden;
}
