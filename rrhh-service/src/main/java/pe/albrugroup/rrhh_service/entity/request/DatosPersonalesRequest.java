package pe.albrugroup.rrhh_service.entity.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Past;
import lombok.*;
import pe.albrugroup.rrhh_service.entity.enums.Documento;
import pe.albrugroup.rrhh_service.entity.enums.EstadoCivil;
import pe.albrugroup.rrhh_service.entity.enums.Nacionalidad;

import java.time.LocalDate;

@Builder @Getter @Setter
@AllArgsConstructor @NoArgsConstructor
public class DatosPersonalesRequest {

    // DATOS PERSONALES
    @NotBlank
    private String nombres;
    @NotBlank
    private String apellidos;
    @NotNull
    private Documento tipoDocumento;
    @NotBlank
    private String numeroDocumento;
    @NotNull
    private Nacionalidad nacionalidad;
    @NotNull @Past
    private LocalDate fechaNacimiento;
    @NotNull
    private EstadoCivil estadoCivil;
    @NotNull
    private Boolean tieneHijos;
}
