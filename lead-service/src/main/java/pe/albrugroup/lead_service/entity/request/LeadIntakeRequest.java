package pe.albrugroup.lead_service.entity.request;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class LeadIntakeRequest {

    @Pattern(regexp = "^$|^\\+\\d{1,3}$", message = "El prefijo debe tener formato +1, +51 o similar")
    private String prefijo;

    @Pattern(regexp = "^$|^\\d{6,15}$", message = "El lead debe contener solo digitos")
    private String lead;

    private String usermeta;

    private Long idCampana;

    @NotNull(message = "El origen es obligatorio")
    private Long idOrigen;
}
