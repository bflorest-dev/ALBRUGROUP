package pe.albrugroup.recruitment_service.entity.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import pe.albrugroup.recruitment_service.entity.enums.EstadoGrupoCapacitacion;
import pe.albrugroup.recruitment_service.entity.enums.SalaCapacitacion;
import pe.albrugroup.recruitment_service.entity.enums.TurnoHorario;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

@Builder @Getter @Setter
@AllArgsConstructor @NoArgsConstructor
public class GrupoCapacitacionResponse {

    private Long id;
    private String codigo;
    private Long idCapacitador;
    private TurnoHorario turno;
    private SalaCapacitacion sala;
    private LocalDate fechaInicio;
    private LocalDate fechaFin;
    private EstadoGrupoCapacitacion estado;
    private Instant createdAt;
    private List<GrupoCapacitacionDetalleResponse> detalles;
}
