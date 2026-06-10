package pe.albrugroup.lead_service.entity.response;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.util.List;

@Getter
@AllArgsConstructor
public class LeadGtrAgrupacionesResponse {

    private List<LeadGtrAgrupacionItemResponse> asesores;
    private List<LeadGtrAgrupacionItemResponse> campanas;
    private List<LeadGtrAgrupacionItemResponse> primerasTipificaciones;
    private List<LeadGtrAgrupacionItemResponse> ultimasTipificaciones;
}
