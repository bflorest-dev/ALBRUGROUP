package pe.albrugroup.lead_service.entity.response;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.util.List;

@Getter
@AllArgsConstructor
public class GtrRankingAsesorResponse {

    private Long idAsesor;
    private String nombreAsesor;
    private long nuevosGestionadosPeriodo;
    private long asignadosPeriodo;
    private long gestionadosPeriodo;
    private long nuevasOportunidadesPeriodo;
    private long preventasPeriodo;
    private long preventasMes;
    private List<SupervisorVentasProveedorResumenResponse> preventasMesPorProveedor;
}
