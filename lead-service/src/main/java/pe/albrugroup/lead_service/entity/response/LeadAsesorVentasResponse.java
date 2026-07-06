package pe.albrugroup.lead_service.entity.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import pe.albrugroup.lead_service.entity.enums.EstadoSeguimiento;
import pe.albrugroup.lead_service.entity.enums.Etapa;

import java.time.Instant;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LeadAsesorVentasResponse {

    private Long id;
    private Instant fechaAsignacion;
    private String prefijo;
    private String lead;
    // Snapshots del contacto que el GTR puede llenar antes o despues de asignar (o el valor real de
    // preventa si ya existe): permiten al asesor identificar el lead sin abrir el modal.
    private String numeroDocumento;
    private String direccion;
    private EstadoSeguimiento estadoSeguimiento;
    private long totalAsignaciones;
    // Etapa real del lead y bandera de atención: cuando el lead no está en PREVENTA, el asesor lo
    // atiende en modo solo lectura (campos deshabilitados) y solo puede tipificarlo o crear oportunidades.
    private Etapa etapa;
    private boolean atencionOtraEtapa;
    // Origen del lead (para mostrar el logo del proveedor al asesor, igual que en la bandeja GTR):
    // proveedor de la campaña si la tiene; si no, el proveedor fallback del equipo del lead.
    private String nombreProveedorCampana;
    private String nombreProveedorEquipo;
}
