package pe.albrugroup.lead_service.entity.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class LeadNumeroParaLlamarRequest {

    @NotBlank(message = "numeroParaLlamar es obligatorio")
    @Pattern(regexp = "^9\\d{8}$", message = "numeroParaLlamar debe tener 9 digitos y empezar en 9")
    private String numeroParaLlamar;
}
