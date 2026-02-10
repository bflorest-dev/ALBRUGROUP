package pe.albrugroup.rrhh_service.entity.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import pe.albrugroup.rrhh_service.entity.enums.Distrito;

@Builder @Getter @Setter
@AllArgsConstructor @NoArgsConstructor
public class DatosContactoUbicacionRequest {

    // CONTACTO
    @NotBlank private String celularPersonal;
    @NotBlank @Email private String correoPersonal;
    // UBICACION
    @NotNull private Distrito distrito;
    @NotBlank private String direccion;
}
