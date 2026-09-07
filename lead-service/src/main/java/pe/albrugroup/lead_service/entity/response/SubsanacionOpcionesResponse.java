package pe.albrugroup.lead_service.entity.response;

import lombok.Builder;
import lombok.Getter;
import pe.albrugroup.lead_service.entity.enums.ComportamientoTipificacion;
import pe.albrugroup.lead_service.entity.enums.Etapa;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Set;

@Getter
@Builder
public class SubsanacionOpcionesResponse {
    private Long idEquipo;
    private List<ProveedorOpcion> proveedores;
    private List<CampanaOpcion> campanas;
    private List<PlanOpcion> planes;
    private List<TipificacionOpcion> preventa;
    private List<TipificacionOpcion> venta;

    public record ProveedorOpcion(Long id, String nombre, boolean activo) { }

    public record CampanaOpcion(Long id, String nombre, Long idProveedor, String proveedor, boolean activo) { }

    public record PlanOpcion(
            Long id,
            String nombre,
            BigDecimal precio,
            Long idProveedor,
            String proveedor,
            LocalDate vigenciaDesde,
            LocalDate vigenciaHasta,
            boolean activo
    ) { }

    public record TipificacionOpcion(
            Long idTipificacion,
            String codigoTipificacion,
            String descripcionTipificacion,
            Integer ordenTipificacion,
            boolean tipificacionActiva,
            Long idSubtipificacion,
            String codigoSubtipificacion,
            String descripcionSubtipificacion,
            Integer ordenSubtipificacion,
            boolean subtipificacionActiva,
            Etapa etapaCambio,
            Set<ComportamientoTipificacion> comportamientos
    ) { }
}
