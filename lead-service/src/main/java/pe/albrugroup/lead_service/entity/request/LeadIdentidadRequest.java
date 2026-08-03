package pe.albrugroup.lead_service.entity.request;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Pattern;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class LeadIdentidadRequest {

    @Pattern(regexp = "^$|^\\+\\d{1,3}$", message = "El prefijo debe tener formato +1, +51 o similar")
    private String prefijo;

    @Pattern(regexp = "^$|^\\d{6,15}$", message = "El lead debe contener solo digitos")
    private String lead;

    private String usermeta;

    @AssertTrue(message = "Debe enviar telefono completo o usermeta")
    public boolean isIdentidadPresente() {
        boolean tienePrefijo = hasText(prefijo);
        boolean tieneLead = hasText(lead);
        boolean tieneUsermeta = hasText(usermeta);
        return tieneUsermeta || (tienePrefijo && tieneLead);
    }

    @AssertTrue(message = "Para completar telefono debe enviar prefijo y lead")
    public boolean isTelefonoCompleto() {
        return hasText(prefijo) == hasText(lead);
    }

    private boolean hasText(String value) {
        return value != null && !value.isBlank();
    }
}
