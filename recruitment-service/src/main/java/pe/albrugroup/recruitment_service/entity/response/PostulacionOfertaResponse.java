package pe.albrugroup.recruitment_service.entity.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import pe.albrugroup.recruitment_service.entity.enums.Negocio;
import pe.albrugroup.recruitment_service.entity.enums.PuestoObjetivo;
import pe.albrugroup.recruitment_service.entity.enums.TurnoHorario;

@Builder
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class PostulacionOfertaResponse {

    private Long id;
    private String codigo;
    private Negocio negocio;
    private PuestoObjetivo puestoObjetivo;
    private TurnoHorario horario;
}
