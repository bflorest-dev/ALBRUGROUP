package pe.albrugroup.rrhh_service.entity.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Past;
import lombok.*;
import pe.albrugroup.rrhh_service.entity.enums.*;
import java.time.LocalDate;

@Builder(toBuilder = true) @Getter @Setter
@AllArgsConstructor @NoArgsConstructor
public class RegistrarEmpleadoRequest {

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
    // CONTACTO
    @NotBlank
    private String celularPersonal;
    private String celularCorporativo;
    @NotBlank @Email
    private String correo;
    // UBICACION
    @NotNull
    private Distrito distrito;
    @NotBlank
    private String direccion;
    // INFORMACION FINANCIERA
    @NotNull
    private Banco banco;
    @NotBlank
    private String cuentaBancaria;
    @NotBlank
    private String cuentaInterbancaria;
}
