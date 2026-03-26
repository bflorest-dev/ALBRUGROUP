package pe.albrugroup.recruitment_service.entity.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
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

    @NotBlank private String nombres;
    @NotBlank private String apellidos;
    @NotNull private Documento tipoDocumento;
    @NotBlank private String documento;
    @NotBlank private String celular;
    @NotNull private LocalDate fechaNacimiento;
}
