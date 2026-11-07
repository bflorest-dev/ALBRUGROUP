package pe.albrugroup.schedule_service.entity.request.horario;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import pe.albrugroup.schedule_service.entity.enums.ModalidadContrato;

import java.time.LocalDate;
import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReemplazarHorarioRequest {

    @NotNull(message = "modalidad es obligatoria")
    private ModalidadContrato modalidad;

    @NotNull(message = "fechaInicio es obligatoria")
    private LocalDate fechaInicio;

    /** Solo ADMINISTRADOR puede usarlo y únicamente para una fecha hasta hoy. */
    @Builder.Default
    private Boolean correccionRetroactiva = Boolean.FALSE;

    @Builder.Default
    @NotNull(message = "compensable es obligatorio")
    private Boolean compensable = Boolean.TRUE;

    @Valid
    @NotEmpty(message = "detalles es obligatorio")
    private List<BloqueHorarioRequest> detalles;
}
