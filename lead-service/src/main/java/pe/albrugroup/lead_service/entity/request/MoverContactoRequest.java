package pe.albrugroup.lead_service.entity.request;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

// Reubicación de un lead hacia otro contacto (por su id).
@Getter
@Setter
public class MoverContactoRequest {
    @NotNull(message = "idContactoDestino es obligatorio")
    private Long idContactoDestino;
}
