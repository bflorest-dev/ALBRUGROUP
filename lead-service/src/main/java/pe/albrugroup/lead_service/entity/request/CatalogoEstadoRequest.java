package pe.albrugroup.lead_service.entity.request;

import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
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
public class CatalogoEstadoRequest {

    @NotNull
    @Enumerated(EnumType.STRING)
    private Etapa etapa;

    @Builder.Default
    private List<Long> tipificacionesActivar = new ArrayList<>();

    @Builder.Default
    private List<Long> tipificacionesDesactivar = new ArrayList<>();

    @Builder.Default
    private List<Long> subtipificacionesActivar = new ArrayList<>();

    @Builder.Default
    private List<Long> subtipificacionesDesactivar = new ArrayList<>();
}
