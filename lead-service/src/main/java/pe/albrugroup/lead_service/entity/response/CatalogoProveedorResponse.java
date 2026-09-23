package pe.albrugroup.lead_service.entity.response;

import lombok.AllArgsConstructor;
import lombok.Getter;
import pe.albrugroup.lead_service.entity.enums.Etapa;

import java.util.List;

@Getter
@AllArgsConstructor
public class CatalogoProveedorResponse {
    private final Long idProveedor;
    private final String nombreProveedor;
    private final Etapa etapa;
    private final List<TipificacionResponse> tipificaciones;
}
