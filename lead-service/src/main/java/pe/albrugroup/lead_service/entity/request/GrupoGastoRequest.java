package pe.albrugroup.lead_service.entity.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter @Setter
public class GrupoGastoRequest {

    @NotBlank(message = "nombre es obligatorio")
    private String nombre;

    @NotNull(message = "orden es obligatorio")
    private Integer orden;
}
