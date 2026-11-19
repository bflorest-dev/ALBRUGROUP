package pe.albrugroup.recruitment_service.entity.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PastOrPresent;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import pe.albrugroup.recruitment_service.entity.enums.Documento;

import java.time.LocalDate;

@Builder @Getter @Setter
@AllArgsConstructor @NoArgsConstructor
public class PostulanteRequest {

    @NotBlank @Size(min = 2, max = 120)
    @Pattern(regexp = "^[\\p{L}]+(?: [\\p{L}]+)*$")
    private String nombres;

    @NotBlank @Size(min = 2, max = 120)
    @Pattern(regexp = "^[\\p{L}]+(?: [\\p{L}]+)*$")
    private String apellidos;

    @NotNull private Documento tipoDocumento;

    @NotBlank @Size(max = 12)
    @Pattern(regexp = "^\\d+$")
    private String documento;

    @NotBlank
    @Pattern(regexp = "^9\\d{8}$")
    private String celular;

    @Size(max = 9)
    @Pattern(regexp = "^9\\d{8}$")
    private String numeroExclusivoLlamadas;

    @Size(max = 80)
    @Pattern(regexp = "^@*[A-Za-z0-9._-]+$")
    private String usuarioMeta;

    @NotNull @PastOrPresent
    private LocalDate fechaNacimiento;
}
