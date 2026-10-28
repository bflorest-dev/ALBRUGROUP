package pe.albrugroup.lead_service.entity.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;
import pe.albrugroup.lead_service.entity.enums.CategoriaGasto;

@Getter @Setter
public class TipoGastoRequest {

    @NotNull(message = "idGrupoGasto es obligatorio")
    private Long idGrupoGasto;

    @NotBlank(message = "nombre es obligatorio")
    private String nombre;

    @NotNull(message = "categoria es obligatorio")
    private CategoriaGasto categoria;
}
