package pe.albrugroup.lead_service.entity.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import pe.albrugroup.lead_service.entity.enums.Base;
import pe.albrugroup.lead_service.entity.enums.EstadoSeguimiento;

import java.time.Instant;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LeadGtrResponse {

    private Long id;
    private Instant createdAt;
    private String prefijo;
    private String lead;
    private String nombreCampana;
    private String nombreProveedorCampana;
    private Base base;
    private String nombreTitular;
    private String codigoTipificacion;
    private String codigoSubtipificacion;
    private String nombreAsesorAsignado;
    private EstadoSeguimiento estadoSeguimiento;
    private long reasignaciones;
}
