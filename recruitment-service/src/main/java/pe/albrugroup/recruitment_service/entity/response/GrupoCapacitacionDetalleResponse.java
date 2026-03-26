package pe.albrugroup.recruitment_service.entity.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import pe.albrugroup.recruitment_service.entity.enums.EstadoCapacitacionPostulante;

import java.time.Instant;
import java.time.LocalDate;

@Builder @Getter @Setter
@AllArgsConstructor @NoArgsConstructor
public class GrupoCapacitacionDetalleResponse {

    private Long id;
    private EstadoCapacitacionPostulante estadoCapacitacion;
    private LocalDate fechaAsignacion;
    private LocalDate fechaResultado;
    private Long idEmpleadoContratado;
    private LocalDate fechaContratacion;
    private Boolean cumplioTresMeses;
    private LocalDate fechaCumplioTresMeses;
    private Instant createdAt;
    private Instant updatedAt;
    private PostulacionResponse postulacion;
}
