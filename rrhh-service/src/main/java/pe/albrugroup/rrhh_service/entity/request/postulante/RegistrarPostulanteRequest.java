package pe.albrugroup.rrhh_service.entity.request.postulante;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import pe.albrugroup.rrhh_service.entity.enums.Documento;
import pe.albrugroup.rrhh_service.entity.enums.Origen;
import pe.albrugroup.rrhh_service.entity.enums.PuestoTrabajo;

@Builder @Getter @Setter
@AllArgsConstructor @NoArgsConstructor
public class RegistrarPostulanteRequest {

    // EMPLEADO PARCIAL
    @NotBlank private String nombres;
    @NotBlank private String apellidos;
    @NotNull private Documento tipoDocumento;
    @NotBlank private String numeroDocumento;
    @NotBlank private String celularPersonal;
    // POSTULANTE
    @NotNull private Origen origen;
    @NotNull private PuestoTrabajo puestoTrabajo;
}
