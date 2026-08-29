package pe.albrugroup.lead_service.entity.request;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

// Intercambio atómico del teléfono (prefijo+lead) entre dos contactos.
@Getter
@Setter
public class IntercambiarTelefonoRequest {
    @NotNull(message = "idContactoA es obligatorio")
    private Long idContactoA;
    @NotNull(message = "idContactoB es obligatorio")
    private Long idContactoB;
}
