package pe.albrugroup.lead_service.entity.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Builder
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class CampanaWhatsappRequest {

    @NotBlank(message = "El prefijo es obligatorio")
    @Pattern(regexp = "^\\+\\d{2,3}$", message = "El prefijo debe tener formato +51 o similar")
    private String prefijo;

    @NotBlank(message = "El numero de WhatsApp es obligatorio")
    @Pattern(regexp = "^\\d{6,15}$", message = "El numero de WhatsApp debe contener solo digitos")
    private String numeroWhatsApp;
}
