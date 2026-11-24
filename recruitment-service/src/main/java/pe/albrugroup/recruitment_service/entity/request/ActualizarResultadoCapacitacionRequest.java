package pe.albrugroup.recruitment_service.entity.request;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import pe.albrugroup.recruitment_service.entity.enums.EstadoCapacitacionPostulante;

import java.time.LocalDate;

@Builder
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class ActualizarResultadoCapacitacionRequest {

    @NotNull(message = "El resultado de capacitacion es obligatorio")
    private EstadoCapacitacionPostulante estadoCapacitacion;

    private LocalDate fechaResultado;
}
