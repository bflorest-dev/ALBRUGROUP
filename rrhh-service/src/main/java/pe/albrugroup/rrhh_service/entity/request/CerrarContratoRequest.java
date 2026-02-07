package pe.albrugroup.rrhh_service.entity.request;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.time.LocalDate;

@Builder @Getter @Setter
@AllArgsConstructor @NoArgsConstructor
public class CerrarContratoRequest {

    @NotBlank
    private LocalDate fechaFin;
}
