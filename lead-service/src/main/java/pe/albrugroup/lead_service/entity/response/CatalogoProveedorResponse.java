package pe.albrugroup.lead_service.entity.response;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import pe.albrugroup.lead_service.entity.enums.Etapa;

import java.util.List;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class CatalogoProveedorResponse {
    private Long idProveedor;
    private String nombreProveedor;
    private Etapa etapa;
    private List<TipificacionResponse> tipificaciones;
}
