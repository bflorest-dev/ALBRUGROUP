package pe.albrugroup.lead_service.entity.response;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.util.List;

@Getter
@AllArgsConstructor
public class SupervisorVentasResumenResponse {

    private Long idAsesor;
    private String nombreAsesor;
    private long asignadosActuales;
    private long gestionadosHoy;
    private long preventasHoy;
    private long preventasMes;
    private List<SupervisorVentasProveedorResumenResponse> preventasMesPorProveedor;
}
