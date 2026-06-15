package pe.albrugroup.schedule_service.entity.request.horario;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AjusteJornadaRequest {

    @NotNull(message = "inicio es obligatorio")
    private LocalDateTime inicio;

    @NotNull(message = "fin es obligatorio")
    private LocalDateTime fin;

    @NotBlank(message = "motivo es obligatorio")
    @Size(max = 300, message = "motivo no puede superar 300 caracteres")
    private String motivo;
}
