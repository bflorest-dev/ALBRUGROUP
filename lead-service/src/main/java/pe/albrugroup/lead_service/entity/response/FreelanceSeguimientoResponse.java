package pe.albrugroup.lead_service.entity.response;

import pe.albrugroup.lead_service.entity.enums.Etapa;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

public record FreelanceSeguimientoResponse(
        Contadores contadores,
        List<EstadoFila> estados,
        List<ProveedorFila> proveedores,
        List<Detalle> detalle
) {
    public record Contadores(long registradas, long subidas, long instaladas, long retornadas) { }
    public record EstadoFila(String clave, long cantidad) { }
    public record ProveedorFila(Long idProveedor, String proveedor, long registradas, long subidas,
                               long instaladas, long retornadas) { }
    public record Detalle(
            Long idLead,
            String lead,
            Instant fechaRegistro,
            String clasificacion,
            String tipificacionVenta,
            String subtipificacionVenta,
            String asesorVenta,
            LocalDate fechaRelevante,
            Instant fechaGestion,
            String comentario,
            String tipoDocumento,
            String numeroDocumento,
            String cliente,
            String celularRegistro,
            String celularReferencia,
            String departamento,
            String distrito,
            Long idProveedor,
            String proveedor,
            Long idPlan,
            String plan,
            Etapa etapaActual,
            int numeroIntentos,
            boolean requiereCorreccion,
            boolean puedeCorregir
    ) { }
}
