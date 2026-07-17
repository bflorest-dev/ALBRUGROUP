package pe.albrugroup.lead_service.entity.response;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.util.List;

@Getter
@AllArgsConstructor
public class LeadGtrAgrupacionesResponse {

    private List<LeadGtrAgrupacionItemResponse> asesores;
    private List<LeadGtrAgrupacionItemResponse> campanas;
    private List<LeadGtrAgrupacionItemResponse> equipos;
    private List<LeadGtrAgrupacionItemResponse> estados;
    private List<LeadGtrAgrupacionItemResponse> primerasTipificaciones;
    private List<LeadGtrAgrupacionItemResponse> mayoresTipificaciones;
    private List<LeadGtrAgrupacionItemResponse> ultimasTipificaciones;
    private List<LeadGtrAgrupacionItemResponse> ingresos;
    /** Total de eventos REGISTRO del día (incluye repeticiones); los leads únicos = suma de los grupos por asesor. */
    private Long totalRegistros;
}
