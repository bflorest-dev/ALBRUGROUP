package pe.albrugroup.schedule_service.entity.request.horario;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import pe.albrugroup.schedule_service.entity.enums.RazonAjuste;

import java.time.LocalDateTime;

/**
 * Registro de un ajuste de jornada (v2) con RAZON explicita. La razon (intencion) es ortogonal a la
 * mecanica (origen, que se infiere del solape con la base) y decide autorizacion, status y balance.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RegistrarAjusteRequest {

    @NotNull(message = "inicio es obligatorio")
    private LocalDateTime inicio;

    @NotNull(message = "fin es obligatorio")
    private LocalDateTime fin;

    @NotBlank(message = "motivo es obligatorio")
    private String motivo;

    @NotNull(message = "razon es obligatoria")
    private RazonAjuste razon;
}
