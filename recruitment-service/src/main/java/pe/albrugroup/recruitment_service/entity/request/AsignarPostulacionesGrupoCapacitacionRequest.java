package pe.albrugroup.recruitment_service.entity.request;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
public class AsignarPostulacionesGrupoCapacitacionRequest {

    @NotEmpty
    private List<@NotNull @Positive Long> idsPostulaciones;
}
