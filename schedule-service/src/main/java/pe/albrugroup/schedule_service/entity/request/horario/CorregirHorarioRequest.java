package pe.albrugroup.schedule_service.entity.request.horario;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import pe.albrugroup.schedule_service.entity.enums.ModalidadContrato;

import java.util.List;

/**
 * Corrige IN-SITU un horario ya existente que aun no ha producido marcaciones reales.
 * No mueve la vigencia (no recibe fechaInicio); reemplaza modalidad, compensable y los
 * detalles por dia. Si el horario tiene al menos una asistencia con marcacion real
 * (fechaHoraIngreso != null), el servicio rechaza con CONFLICT y se debe usar una
 * ExcepcionHorario para cambios puntuales o un reemplazo para cambios estructurales.
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CorregirHorarioRequest {

    @NotNull(message = "modalidad es obligatoria")
    private ModalidadContrato modalidad;

    @Builder.Default
    @NotNull(message = "compensable es obligatorio")
    private Boolean compensable = Boolean.TRUE;

    @Valid
    @NotEmpty(message = "detalles es obligatorio")
    private List<BloqueHorarioRequest> detalles;
}
