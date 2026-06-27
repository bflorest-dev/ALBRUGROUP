package pe.albrugroup.lead_service.entity.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.Getter;
import lombok.Setter;
import pe.albrugroup.lead_service.entity.enums.Base;

@Getter
@Setter
public class LeadIntakeRequest {

    @NotBlank(message = "El prefijo es obligatorio")
    @Pattern(regexp = "^\\+\\d{1,3}$", message = "El prefijo debe tener formato +1, +51 o similar")
    private String prefijo;

    @NotBlank(message = "El lead es obligatorio")
    @Pattern(regexp = "^\\d{6,15}$", message = "El lead debe contener solo digitos")
    private String lead;

    // Opcional: un lead puede ingresar sin campana (queda en la bandeja del equipo del GTR).
    private Long idCampana;

    @NotNull(message = "La base es obligatoria")
    private Base base;
}
