package pe.albrugroup.recruitment_service.entity.request;

import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.PastOrPresent;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import pe.albrugroup.recruitment_service.entity.enums.Documento;

import java.time.LocalDate;

@Builder
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class ActualizarDatosPostulanteRequest {

    @Size(max = 120)
    @Pattern(regexp = "^$|^[\\p{L}]+(?: [\\p{L}]+)*$")
    private String nombres;

    @Size(max = 120)
    @Pattern(regexp = "^$|^[\\p{L}]+(?: [\\p{L}]+)*$")
    private String apellidos;

    private Documento tipoDocumento;

    @Size(max = 12)
    @Pattern(regexp = "^$|\\d+$")
    private String documento;

    @Pattern(regexp = "^$|9\\d{8}$")
    private String celular;

    @Size(max = 9)
    @Pattern(regexp = "^$|9\\d{8}$")
    private String numeroExclusivoLlamadas;

    @Size(max = 80)
    @Pattern(regexp = "^$|^@*[A-Za-z0-9._-]+$")
    private String usuarioMeta;

    @PastOrPresent private LocalDate fechaNacimiento;
}
