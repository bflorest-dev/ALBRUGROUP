package pe.albrugroup.schedule_service.entity.request.horario;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import pe.albrugroup.schedule_service.entity.enums.TipoDiaNoLaborable;

import java.time.LocalDate;
import java.util.List;

/**
 * Declara un día no laborable. Si {@code empleadoIds} viene vacío/nulo -> GLOBAL (todos). Si trae ids
 * -> una fila por empleado (EMPLEADO). El "por equipo" lo resuelve el llamador expandiendo el equipo a
 * una lista de empleados. {@code laborable=true} sirve de override (un empleado que sí trabaja un feriado).
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DeclararDiaNoLaborableRequest {

    @NotNull(message = "fecha es obligatoria")
    private LocalDate fecha;

    @NotNull(message = "tipo es obligatorio")
    private TipoDiaNoLaborable tipo;

    private String motivo;

    /** false = día libre (no cuenta FALTA); true = override "sí trabaja". Por defecto false. */
    @Builder.Default
    private boolean laborable = false;

    /** Vacío/nulo = GLOBAL; con ids = una fila EMPLEADO por cada uno. */
    private List<Long> empleadoIds;
}
