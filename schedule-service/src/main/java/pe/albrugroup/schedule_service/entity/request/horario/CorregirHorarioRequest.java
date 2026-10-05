package pe.albrugroup.schedule_service.entity.request.horario;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import pe.albrugroup.schedule_service.entity.enums.ModalidadContrato;

import java.time.LocalDate;
import java.util.List;

/**
 * Corrige un horario ya existente que aun no ha producido marcaciones reales.
 * Puede mover fechaInicio cuando el cambio no pisa asistencias registradas; si
 * solapa un horario anterior, el servicio lo cierra el dia anterior al nuevo inicio.
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CorregirHorarioRequest {

    @NotNull(message = "modalidad es obligatoria")
    private ModalidadContrato modalidad;

    private LocalDate fechaInicio;

    @Builder.Default
    @NotNull(message = "compensable es obligatorio")
    private Boolean compensable = Boolean.TRUE;

    @Valid
    @NotEmpty(message = "detalles es obligatorio")
    private List<BloqueHorarioRequest> detalles;
}
