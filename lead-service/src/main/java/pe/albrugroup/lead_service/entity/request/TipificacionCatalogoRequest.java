package pe.albrugroup.lead_service.entity.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@Builder
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class TipificacionCatalogoRequest {

    private Long id;

    @NotBlank
    private String codigo;

    @NotBlank
    private String descripcion;

    @NotNull
    @Positive
    private Integer orden;

    @Valid
    @Builder.Default
    private List<SubtipificacionCatalogoRequest> subtipificaciones = new ArrayList<>();
}
