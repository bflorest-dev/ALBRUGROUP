package pe.albrugroup.recruitment_service.entity.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import pe.albrugroup.recruitment_service.entity.enums.Accion;
import pe.albrugroup.recruitment_service.entity.enums.Etapa;
import pe.albrugroup.recruitment_service.entity.enums.ModalidadContacto;

import java.time.Instant;

@Builder
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class EventoResponse {

    private Long id;
    private Long idPostulacion;
    private Long idEmpleadoResponsable;
    private Etapa etapa;
    private Accion accion;
    private ModalidadContacto modalidadContacto;
    private Long idTipificacion;
    private Long idSubtipificacion;
    private String tipificacion;
    private String subtipificacion;
    private String observacion;
    private Instant createdAt;
}
