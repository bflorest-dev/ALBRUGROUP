package pe.albrugroup.lead_service.entity.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;
import pe.albrugroup.lead_service.entity.enums.Parentesco;
import pe.albrugroup.lead_service.entity.enums.TipoDocumento;

import java.time.LocalDate;

@Getter
@Setter
public class LeadDatosPreventaRequest {

    @NotNull(message = "tipoDocumento es obligatorio")
    private TipoDocumento tipoDocumento;

    @NotBlank(message = "numeroDocumentoTitularServicio es obligatorio")
    private String numeroDocumentoTitularServicio;
    private String ubigeoNacimiento;
    private String nombreTitularServicio;
    private String celularRegistro;
    private String celularReferencia;
    private String correo;
    private LocalDate fechaNacimiento;
    private Parentesco parentesco;
    private String nombreMadre;
    private String nombrePadre;
    private String numeroDocumentoTitularCelularRegistro;
    private String nombreTitularCelularRegistro;
}
