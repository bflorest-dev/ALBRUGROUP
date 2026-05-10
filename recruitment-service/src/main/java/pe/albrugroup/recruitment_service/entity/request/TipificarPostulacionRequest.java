package pe.albrugroup.recruitment_service.entity.request;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import pe.albrugroup.recruitment_service.entity.enums.ModalidadContacto;

@Builder @Getter @Setter
@AllArgsConstructor @NoArgsConstructor
public class TipificarPostulacionRequest {

    @NotNull @Positive private Long idTipificacion;
    @NotNull @Positive private Long idSubtipificacion;
    @Positive private Long idGrupoCapacitacion;
    private ModalidadContacto modalidadContacto;
    private String observacion;
}
