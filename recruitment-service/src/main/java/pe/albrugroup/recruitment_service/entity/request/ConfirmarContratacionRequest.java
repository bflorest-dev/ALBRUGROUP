package pe.albrugroup.recruitment_service.entity.request;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

@Builder @Getter @Setter
@AllArgsConstructor @NoArgsConstructor
public class ConfirmarContratacionRequest {

    @NotNull @Positive private Long idEmpleadoContratado;
    @NotNull private LocalDate fechaContratacion;
}
