package pe.albrugroup.recruitment_service.entity.response;

import lombok.*;
import pe.albrugroup.recruitment_service.entity.enums.EstadoOferta;
import pe.albrugroup.recruitment_service.entity.enums.Modalidad;
import pe.albrugroup.recruitment_service.entity.enums.Negocio;
import pe.albrugroup.recruitment_service.entity.enums.PuestoObjetivo;
import pe.albrugroup.recruitment_service.entity.enums.TurnoHorario;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

@Builder @Getter @Setter
@AllArgsConstructor @NoArgsConstructor
public class OfertaLaboralResponse {

    private Long id;
    private String codigo;
    private Long idSolicitante;
    private Negocio negocio;
    private PuestoObjetivo puestoObjetivo;
    private Modalidad modalidad;
    private TurnoHorario horario;
    private Integer cantidadInicial;
    private LocalDate plazoInicial;
    private EstadoOferta estado;
    private Instant createdAt;
    private List<OfertaAmpliacionResponse> ampliaciones;
}
