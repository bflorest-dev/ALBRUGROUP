package pe.albrugroup.lead_service.entity.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import pe.albrugroup.lead_service.entity.enums.EstadoEncuestaPostventa;
import pe.albrugroup.lead_service.entity.enums.PrioridadEncuestaPostventa;
import pe.albrugroup.lead_service.entity.enums.StatusEncuestaPostventa;
import pe.albrugroup.lead_service.entity.enums.TipoContactoEncuesta;
import pe.albrugroup.lead_service.entity.enums.TipoEncuestaPostventa;

import java.time.Instant;
import java.time.LocalDateTime;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EncuestaPostventaResponse {

    private Long id;
    private Long idLead;
    private Long idPeriodoFacturacion;
    private TipoEncuestaPostventa tipoEncuesta;
    private TipoContactoEncuesta tipoContacto;
    private Integer calificacion;
    private StatusEncuestaPostventa status;
    private EstadoEncuestaPostventa estado;
    private PrioridadEncuestaPostventa prioridad;
    private LocalDateTime fechaProgramada;
    private LocalDateTime fechaLimite;
    private LocalDateTime fechaRealizada;
    private Integer numeroEncuesta;
    private String comentario;
    private Long idAsesorEncuesta;
    private String nombreAsesorEncuesta;
    private Integer calificacionAsesor;
    private Integer calificacionServicio;
    private Instant createdAt;
    private Instant updatedAt;
}
