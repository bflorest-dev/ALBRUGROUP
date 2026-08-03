package pe.albrugroup.lead_service.entity.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import pe.albrugroup.lead_service.entity.enums.Base;
import pe.albrugroup.lead_service.entity.enums.EstadoSeguimiento;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LeadAgendadoGtrResponse {

    private Long id;
    private Long idEquipo;
    private Instant createdAt;
    private String prefijo;
    private String lead;
    private String usermeta;
    private String nombreCampana;
    private String nombreProveedorCampana;
    private String nombreProveedorEquipo;
    private Base base;
    private String nombreTitular;
    private String codigoTipificacion;
    private String codigoSubtipificacion;
    private String nombreAsesorAsignado;
    private String nombreAsesorTipifico;
    private EstadoSeguimiento estadoSeguimiento;
    private long totalAsignaciones;
    private Instant fechaAgendamiento;
    private String comentario;
    private LocalTime horaProgramada;
    private LocalDate fechaProgramacion;
}
