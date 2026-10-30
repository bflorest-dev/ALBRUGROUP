package pe.albrugroup.recruitment_service.entity.request;

import jakarta.validation.constraints.Size;
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

    @Size(max = 255)
    private String nombres;

    @Size(max = 255)
    private String apellidos;

    private Documento tipoDocumento;

    @Size(max = 255)
    private String documento;

    @Size(max = 255)
    private String celular;

    @Size(max = 255)
    private String numeroExclusivoLlamadas;

    @Size(max = 255)
    private String usuarioMeta;

    private LocalDate fechaNacimiento;
}
