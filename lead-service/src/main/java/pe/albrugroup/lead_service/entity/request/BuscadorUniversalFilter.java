package pe.albrugroup.lead_service.entity.request;

import lombok.Getter;
import lombok.Setter;
import pe.albrugroup.lead_service.entity.enums.AnclaFechaBuscador;
import pe.albrugroup.lead_service.entity.enums.ColumnaUniversal;
import pe.albrugroup.lead_service.entity.enums.EstadoClientePostventa;
import pe.albrugroup.lead_service.entity.enums.EstadoSeguimiento;
import pe.albrugroup.lead_service.entity.enums.Etapa;

import java.time.Instant;
import java.util.List;
import java.util.Set;

@Getter @Setter
public class BuscadorUniversalFilter {

    // Búsqueda universal (OR entre lead, usermeta, sec, sot, customerId, documento, nombreTitular, celular)
    private String q;

    // Texto libre (LIKE) — filtros individuales, se mantienen para uso directo
    private String telefono;
    private String usermeta;
    private String documento;
    private String nombreTitular;

    // Enums exactos
    private Etapa etapa;
    private EstadoSeguimiento estado;
    private EstadoClientePostventa estadoClientePostventa;

    // FKs exactas
    private Long idProveedor;
    private Long idProveedorOrigen;
    private Long idEquipo;
    private Long idAsesor;
    private Long idCampana;
    private Long idOrigen;
    private Long idPlan;
    private Long idZona;

    // Texto exacto
    private String sec;
    private String sot;
    private String customerId;

    // Rango de fechas
    private Instant fechaDesde;
    private Instant fechaHasta;
    private AnclaFechaBuscador anclaFecha;

    // Tipificaciones (IN)
    private List<String> codigosTipificacion;
    private List<String> codigosSubtipificacion;

    // Columnas a mostrar
    private Set<ColumnaUniversal> columnas;
}
