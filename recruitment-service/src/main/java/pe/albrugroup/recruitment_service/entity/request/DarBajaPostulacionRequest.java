package pe.albrugroup.recruitment_service.entity.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Builder
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class DarBajaPostulacionRequest {

    @NotBlank
    @Size(max = 120)
    private String motivo;

    @Size(max = 500)
    private String observacion;
}
