package pe.albrugroup.lead_service.entity.response;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class SupervisorVentasProveedorResumenResponse {

    private Long idProveedor;
    private String nombreProveedor;
    private long cantidad;
}
