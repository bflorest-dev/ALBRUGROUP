package pe.albrugroup.recruitment_service.entity.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import pe.albrugroup.recruitment_service.entity.enums.EstadoBandejaPostulacion;
import pe.albrugroup.recruitment_service.entity.enums.EstadoPostulacion;
import pe.albrugroup.recruitment_service.entity.enums.Etapa;
import pe.albrugroup.recruitment_service.entity.enums.Origen;

import java.time.Instant;

@Builder
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class PostulacionResponse {

    private Long id;
    private Long idGrupoCapacitacion;
    private Long idEmpleadoRegistrador;
    private Origen origen;
    private Etapa etapa;
    private EstadoPostulacion estado;
    private EstadoBandejaPostulacion estadoBandeja;
    private Instant createdAt;
    private Instant updatedAt;
    private PostulanteResponse postulante;
    private PostulacionOfertaResponse ofertaLaboral;
}
