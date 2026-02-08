package pe.albrugroup.rrhh_service.entity.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import pe.albrugroup.rrhh_service.entity.enums.Documento;
import pe.albrugroup.rrhh_service.entity.enums.EstadoPostulacion;
import pe.albrugroup.rrhh_service.entity.enums.Origen;
import pe.albrugroup.rrhh_service.entity.enums.PuestoTrabajo;

import java.math.BigDecimal;
import java.time.LocalDate;

@Builder(toBuilder = true) @Getter @Setter
@AllArgsConstructor @NoArgsConstructor
public class RegistrarPostulanteRequest {

    // DATOS PERSONALES
    @NotBlank
    private String nombres;
    @NotBlank
    private String apellidos;
    @NotNull
    private Documento tipoDocumento;
    @NotBlank
    private String numeroDocumento;
    // CONTACTO
    @NotBlank
    private String celularPersonal;
    // Objetivo
    @NotNull
    private Origen origen;
    @NotNull
    private PuestoTrabajo puestoTrabajo;
    @NotNull
    private EstadoPostulacion estadoPostulacion;
    @NotNull
    private BigDecimal pagoDiaCapacitacion;
    @NotNull
    private LocalDate fechaInicio;
}
