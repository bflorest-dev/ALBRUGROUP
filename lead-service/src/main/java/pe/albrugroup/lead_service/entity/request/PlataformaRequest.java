package pe.albrugroup.lead_service.entity.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class PlataformaRequest {

    @NotBlank(message = "nombre es obligatorio")
    private String nombre;
}
