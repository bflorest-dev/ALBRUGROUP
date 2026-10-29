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
import pe.albrugroup.recruitment_service.entity.enums.PuestoObjetivo;
import pe.albrugroup.recruitment_service.entity.enums.Negocio;
import pe.albrugroup.recruitment_service.entity.enums.Modalidad;
import pe.albrugroup.recruitment_service.entity.enums.TurnoHorario;
import pe.albrugroup.recruitment_service.entity.enums.ModalidadContacto;

import java.time.Instant;
import java.time.LocalDate;

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
    private PuestoObjetivo puestoObjetivo;
    private Negocio negocio;
    private Modalidad modalidad;
    private TurnoHorario horario;
    private LocalDate fechaPostulacion;
    private Etapa etapa;
    private EstadoPostulacion estado;
    private EstadoBandejaPostulacion estadoBandeja;
    private Instant createdAt;
    private Instant updatedAt;
    private java.time.LocalDateTime ultimaGestionAt;
    private String ultimoResultado;
    private String resultadoEvaluacion;
    private Long ultimaGestionResponsableId;
    private ModalidadContacto ultimaGestionModalidad;
    private java.time.LocalDateTime proximaActividadAt;
    private String proximaActividadTipo;
    private PostulanteResponse postulante;
    private PostulacionOfertaResponse ofertaLaboral;
}
