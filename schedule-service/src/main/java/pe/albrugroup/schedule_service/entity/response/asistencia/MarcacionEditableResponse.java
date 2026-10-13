package pe.albrugroup.schedule_service.entity.response.asistencia;

import lombok.Builder;
import lombok.Getter;
import pe.albrugroup.schedule_service.entity.enums.OrigenTramo;
import pe.albrugroup.schedule_service.entity.enums.TipoRegistroMarcacion;
import pe.albrugroup.schedule_service.entity.enums.TipoTramoDia;

import java.time.LocalDateTime;

/** Identificador estable y contexto de una marcacion real editable por administracion. */
@Getter
@Builder
public class MarcacionEditableResponse {

    private TipoRegistroMarcacion tipoRegistro;
    private Long idRegistro;
    private OrigenTramo origen;
    private TipoTramoDia tipoTramo;
    private Boolean esBase;
    private String motivo;
    private LocalDateTime entradaProgramada;
    private LocalDateTime salidaProgramada;
    private LocalDateTime entradaReal;
    private LocalDateTime salidaReal;
    private Boolean abierta;
    private Boolean salidaForzada;
}
