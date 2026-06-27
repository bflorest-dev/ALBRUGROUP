package pe.albrugroup.lead_service.entity.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.*;

@Builder @Getter @Setter
@AllArgsConstructor @NoArgsConstructor
public class CampanaRequest {

    @NotBlank private String nombre;
    @NotBlank(message = "El prefijo es obligatorio")
    @Pattern(regexp = "^\\+\\d{1,3}$", message = "El prefijo debe tener formato +1, +51 o similar")
    private String prefijo;
    @NotBlank(message = "El numero de WhatsApp es obligatorio")
    @Pattern(regexp = "^\\d{6,15}$", message = "El numero de WhatsApp debe contener solo digitos")
    private String numeroWhatsApp;
    @NotNull private Long idCuentaPublicitaria;
    @NotNull private Long idProveedor;
}
