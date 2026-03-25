package pe.albrugroup.recruitment_service.entity.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import pe.albrugroup.recruitment_service.entity.enums.AlcanceSubtipificacion;
import pe.albrugroup.recruitment_service.entity.enums.EstadoBandejaPostulacion;
import pe.albrugroup.recruitment_service.entity.enums.EstadoPostulacion;
import pe.albrugroup.recruitment_service.entity.enums.Etapa;

@Builder
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class SubtipificacionRequest {

    @NotBlank private String codigo;
    @NotBlank private String descripcion;
    @NotNull @Positive private Integer orden;
    @NotNull private AlcanceSubtipificacion alcance;
    private Etapa etapaDestino;
    private EstadoPostulacion estadoDestino;
    private EstadoBandejaPostulacion estadoBandejaDestino;
}
