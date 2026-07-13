package pe.albrugroup.lead_service.entity.request;

import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import pe.albrugroup.lead_service.entity.enums.Etapa;

import java.util.ArrayList;
import java.util.List;

@Builder
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class MatrizCatalogoRequest {

    @NotNull
    @Enumerated(EnumType.STRING)
    private Etapa etapa;

    @NotNull
    private Long idEquipo;

    @NotEmpty
    @Valid
    @Builder.Default
    private List<TipificacionCatalogoRequest> tipificaciones = new ArrayList<>();
}
