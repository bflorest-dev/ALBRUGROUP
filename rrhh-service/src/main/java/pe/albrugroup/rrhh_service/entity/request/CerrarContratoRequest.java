package pe.albrugroup.rrhh_service.entity.request;

import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.LocalDate;

@Builder @Getter @Setter
@AllArgsConstructor @NoArgsConstructor
public class CerrarContratoRequest {

    @NotNull private LocalDate fechaFin;
}
