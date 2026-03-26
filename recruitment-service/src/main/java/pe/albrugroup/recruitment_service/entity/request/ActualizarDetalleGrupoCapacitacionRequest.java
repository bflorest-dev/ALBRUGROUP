package pe.albrugroup.recruitment_service.entity.request;

import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import pe.albrugroup.recruitment_service.entity.enums.EstadoCapacitacionPostulante;

import java.time.LocalDate;

@Builder @Getter @Setter
@AllArgsConstructor @NoArgsConstructor
public class ActualizarDetalleGrupoCapacitacionRequest {

    private EstadoCapacitacionPostulante estadoCapacitacion;
    private LocalDate fechaResultado;
    @Positive private Long idEmpleadoContratado;
    private LocalDate fechaContratacion;
    private Boolean cumplioTresMeses;
    private LocalDate fechaCumplioTresMeses;
}
