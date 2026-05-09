package pe.albrugroup.lead_service.entity.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import pe.albrugroup.lead_service.entity.enums.EstadoPostventa;
import pe.albrugroup.lead_service.entity.enums.Etapa;

@Builder
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class SubtipificacionCatalogoRequest {

    private Long id;

    @NotBlank
    private String codigo;

    @NotBlank
    private String descripcion;

    @NotNull
    @Positive
    private Integer orden;

    private Etapa etapaCambio;
    private EstadoPostventa estadoPostventaCambio;
}
