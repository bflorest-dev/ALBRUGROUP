package pe.albrugroup.lead_service.entity.request;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Builder
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class FlujoMatrizTipificacionRequest {

    private Long tipificacionOrigenId;

    @NotNull
    private Long tipificacionDestinoId;

    @Builder.Default
    private Boolean activo = Boolean.TRUE;
}
