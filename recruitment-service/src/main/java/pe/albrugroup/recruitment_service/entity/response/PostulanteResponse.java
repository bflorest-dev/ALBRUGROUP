package pe.albrugroup.recruitment_service.entity.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import pe.albrugroup.recruitment_service.entity.enums.Documento;

import java.time.Instant;
import java.time.LocalDate;

@Builder
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class PostulanteResponse {

    private Long id;
    private String nombres;
    private String apellidos;
    private Documento tipoDocumento;
    private String documento;
    private String celular;
    private LocalDate fechaNacimiento;
    private Boolean listaNegra;
    private Instant createdAt;
    private Instant updatedAt;
}
