package pe.albrugroup.schedule_service.entity.request.horario;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.*;
import pe.albrugroup.schedule_service.entity.enums.ModalidadContrato;

import java.time.LocalDate;
import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RegistrarHorarioRequest {

    @NotNull(message = "idEmpleado es obligatorio")
    @Positive(message = "idEmpleado debe ser positivo")
    private Long idEmpleado;

    @NotNull(message = "idContrato es obligatorio")
    @Positive(message = "idContrato debe ser positivo")
    private Long idContrato;

    @NotNull(message = "modalidad es obligatoria")
    private ModalidadContrato modalidad;

    @NotNull(message = "fechaInicio es obligatoria")
    private LocalDate fechaInicio;

    @Builder.Default
    @NotNull(message = "compensable es obligatorio")
    private Boolean compensable = Boolean.TRUE;

    @Valid
    @NotEmpty(message = "detalles es obligatorio")
    private List<BloqueHorarioRequest> detalles;
}
