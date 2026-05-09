package pe.albrugroup.recruitment_service.entity.request;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Builder @Getter @Setter
@AllArgsConstructor @NoArgsConstructor
public class AgregarPostulacionGrupoCapacitacionRequest {

    @NotNull @Positive private Long idPostulacion;
}
