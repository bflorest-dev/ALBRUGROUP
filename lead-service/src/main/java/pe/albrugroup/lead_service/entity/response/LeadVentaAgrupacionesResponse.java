package pe.albrugroup.lead_service.entity.response;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.util.List;

@Getter
@AllArgsConstructor
public class LeadVentaAgrupacionesResponse {

    private List<LeadGtrAgrupacionItemResponse> estados;
    private List<LeadGtrAgrupacionItemResponse> proveedores;
    private List<LeadGtrAgrupacionItemResponse> planes;
    private List<LeadGtrAgrupacionItemResponse> ultimosGestores;
    private List<LeadGtrAgrupacionItemResponse> tipificaciones;
}
