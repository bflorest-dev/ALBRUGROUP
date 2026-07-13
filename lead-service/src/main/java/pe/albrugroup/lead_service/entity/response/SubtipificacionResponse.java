package pe.albrugroup.lead_service.entity.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import pe.albrugroup.lead_service.entity.enums.ComportamientoTipificacion;
import pe.albrugroup.lead_service.entity.enums.EstadoPostventa;
import pe.albrugroup.lead_service.entity.enums.Etapa;

import java.util.Set;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SubtipificacionResponse {

    private Long id;
    private String codigo;
    private String descripcion;
    private Integer orden;
    private Etapa etapaCambio;
    private EstadoPostventa estadoPostventaCambio;
    private Set<ComportamientoTipificacion> comportamientos;
}
