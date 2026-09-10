package pe.albrugroup.lead_service.service;

import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.hibernate.Session;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.albrugroup.lead_service.configuration.OperationalDateTime;
import pe.albrugroup.lead_service.entity.Distrito;
import pe.albrugroup.lead_service.entity.enums.Etapa;
import pe.albrugroup.lead_service.entity.enums.TipoFechaRelevanteVenta;
import pe.albrugroup.lead_service.entity.response.VentaResumenDiarioDetalle;
import pe.albrugroup.lead_service.entity.response.VentaResumenDiarioFila;
import pe.albrugroup.lead_service.entity.response.VentaResumenDiarioResponse;
import pe.albrugroup.lead_service.entity.response.VentaResumenDiarioResponse.AsesorFila;
import pe.albrugroup.lead_service.entity.response.VentaResumenDiarioResponse.CeldaTipi;
import pe.albrugroup.lead_service.entity.response.VentaResumenDiarioResponse.Contadores;
import pe.albrugroup.lead_service.repository.DistritoRepository;
import pe.albrugroup.lead_service.repository.VentaResumenDiarioQueryRepository;

import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Resumen diario de VENTA: replica web del reporte Excel del equipo. Trae en una sola consulta el cohorte de
 * leads que entraron a VENTA en el periodo (por {@code fechaIngresoEtapa}, que ahora refleja la ultima entrada,
 * ver {@link LeadEtapaResumenService#registrarEntradaEtapa}) y deriva en memoria las 4 tablas del reporte, de
 * modo que cuadran por construccion: {@code Retornos + Sin Gestionar + Sum(tipificaciones) == ingresadas}.
 *
 * <p>Alcance cross-equipo/proveedor: desactiva el {@code equipoFilter} (auto-activado por rol) igual que el
 * Dashboard VENTA, para que un asesor multi-equipo aparezca con todo su merito junto; {@code idEquipo}/
 * {@code idProveedor} son filtros opcionales.</p>
 */
@Service
@RequiredArgsConstructor
public class VentaResumenDiarioService {

    private final VentaResumenDiarioQueryRepository queryRepository;
    private final DistritoRepository distritoRepository;
    private final EntityManager entityManager;

    // Matriz VENTA (V50): INGRESADO orden 4 -> "subida"; INSTALADO es el estado terminal instalado.
    private static final int ORDEN_INGRESADO = 4;
    private static final String CODIGO_INSTALADO = "INSTALADO";
    private static final String BUCKET_RETORNO = "RETORNO";
    private static final String BUCKET_SIN_GESTIONAR = "SIN_GESTIONAR";

    @Transactional(readOnly = true)
    public VentaResumenDiarioResponse obtener(Long idEquipo, Long idProveedor, LocalDate desde, LocalDate hasta) {
        desactivarEquipoFilter();

        LocalDate desdeR = desde != null ? desde : OperationalDateTime.today();
        LocalDate hastaR = hasta != null ? hasta : desdeR;
        Instant inicio = OperationalDateTime.startOfDay(desdeR);
        Instant fin = OperationalDateTime.endExclusiveOfDay(hastaR);

        List<VentaResumenDiarioFila> filas = queryRepository.cohorteIngresadas(inicio, fin, idEquipo, idProveedor);

        Map<String, Distrito> ubigeos = resolverUbigeos(filas);

        List<VentaResumenDiarioDetalle> detalle = new ArrayList<>(filas.size());
        int orden = 1;
        for (VentaResumenDiarioFila f : filas) {
            detalle.add(construirDetalle(orden++, f, ubigeos));
        }

        Contadores contadores = construirContadores(filas);
        List<CeldaTipi> tipificaciones = construirTipificaciones(filas);
        List<AsesorFila> porAsesor = construirPorAsesor(filas);

        return new VentaResumenDiarioResponse(contadores, tipificaciones, porAsesor, detalle);
    }

    /** El resumen es cross-equipo dentro de su alcance: el equipoFilter (auto-activado por rol) no debe estrecharlo. */
    private void desactivarEquipoFilter() {
        Session session = entityManager.unwrap(Session.class);
        if (session.getEnabledFilter("equipoFilter") != null) {
            session.disableFilter("equipoFilter");
        }
    }

    private Map<String, Distrito> resolverUbigeos(List<VentaResumenDiarioFila> filas) {
        Set<String> codigos = filas.stream()
                .map(VentaResumenDiarioFila::ubigeo)
                .filter(u -> u != null && !u.isBlank())
                .collect(Collectors.toSet());
        if (codigos.isEmpty()) {
            return Map.of();
        }
        Map<String, Distrito> map = new LinkedHashMap<>();
        for (Distrito d : distritoRepository.findByCodigoInWithDepartamento(codigos)) {
            map.put(d.getCodigo(), d);
        }
        return map;
    }

    private VentaResumenDiarioDetalle construirDetalle(
            int orden, VentaResumenDiarioFila f, Map<String, Distrito> ubigeos) {

        // Fecha relevante segun el comportamiento de la tipi (misma prioridad que la bandeja de VENTA).
        TipoFechaRelevanteVenta tipo;
        LocalDate fechaRelevante = null;
        var horaRelevante = f.horaProgramada();
        Instant fechaRelevanteAt = null;
        if (f.fechaProgramacion() != null) {
            tipo = TipoFechaRelevanteVenta.PROGRAMACION;
            fechaRelevante = f.fechaProgramacion();
        } else if (f.fechaRechazo() != null) {
            tipo = TipoFechaRelevanteVenta.RECHAZO;
            fechaRelevante = f.fechaRechazo();
            horaRelevante = null;
        } else if (f.fechaInstalacion() != null) {
            tipo = TipoFechaRelevanteVenta.INSTALACION;
            fechaRelevante = f.fechaInstalacion();
            horaRelevante = null;
        } else {
            tipo = TipoFechaRelevanteVenta.TIPIFICACION;
            fechaRelevanteAt = f.fechaTipificacion();
            horaRelevante = null;
        }

        String departamento = null;
        String distrito = null;
        if (f.ubigeo() != null && !f.ubigeo().isBlank()) {
            Distrito d = ubigeos.get(f.ubigeo());
            if (d != null) {
                distrito = d.getNombre();
                departamento = d.getDepartamento() != null ? d.getDepartamento().getNombre() : null;
            }
        }

        return new VentaResumenDiarioDetalle(
                orden,
                f.idLead(),
                f.lead(),
                f.fechaIngresoEtapa(),
                f.ultimaCodigoTipificacion(),
                f.ultimaCodigoSubtipificacion(),
                f.nombreAsesorMerito(),
                f.nombreAsesorUltimaGestion(),
                fechaRelevante,
                horaRelevante,
                fechaRelevanteAt,
                tipo,
                f.comentario(),
                f.tipoDocumento(),
                f.numeroDocumento(),
                f.nombreCliente(),
                f.celularRegistro(),
                f.celularReferencia(),
                departamento,
                distrito,
                f.ubigeo(),
                f.etapaActual(),
                clasificar(f));
    }

    /**
     * Bucket de la Tabla 2 con precedencia: si el lead volvio a PREVENTA es un RETORNO (sin importar su ultima
     * tipificacion de VENTA); si no y no tiene ultima tipificacion es SIN_GESTIONAR; si no, su codigo de ultima
     * tipificacion de VENTA. Asi los buckets cubren exactamente el cohorte de ingresadas.
     */
    private String clasificar(VentaResumenDiarioFila f) {
        if (f.etapaActual() == Etapa.PREVENTA) {
            return BUCKET_RETORNO;
        }
        if (f.ultimaCodigoTipificacion() == null) {
            return BUCKET_SIN_GESTIONAR;
        }
        return f.ultimaCodigoTipificacion();
    }

    private Contadores construirContadores(List<VentaResumenDiarioFila> filas) {
        long ingresadas = filas.size();
        long subidas = filas.stream()
                .filter(f -> f.mayorRangoOrden() != null && f.mayorRangoOrden() >= ORDEN_INGRESADO)
                .count();
        long instaladas = filas.stream()
                .filter(f -> CODIGO_INSTALADO.equals(clasificar(f)))
                .count();
        return new Contadores(ingresadas, subidas, instaladas);
    }

    private List<CeldaTipi> construirTipificaciones(List<VentaResumenDiarioFila> filas) {
        Map<String, long[]> conteo = new LinkedHashMap<>();   // clave -> {cantidad}
        Map<String, Integer> ordenes = new LinkedHashMap<>();  // clave -> orden de matriz (null para buckets especiales)
        for (VentaResumenDiarioFila f : filas) {
            String clave = clasificar(f);
            conteo.computeIfAbsent(clave, k -> new long[1])[0]++;
            if (!BUCKET_RETORNO.equals(clave) && !BUCKET_SIN_GESTIONAR.equals(clave)) {
                ordenes.putIfAbsent(clave, f.ultimaTipificacionOrden());
            }
        }
        return conteo.entrySet().stream()
                .map(e -> new CeldaTipi(e.getKey(), ordenes.get(e.getKey()), e.getValue()[0]))
                .sorted(comparadorCeldas())
                .toList();
    }

    private List<AsesorFila> construirPorAsesor(List<VentaResumenDiarioFila> filas) {
        // Agrupa por asesor de merito de PREVENTA. Clave por id; merito nulo -> "#N/A".
        Map<Long, List<VentaResumenDiarioFila>> porAsesor = filas.stream()
                .collect(Collectors.groupingBy(
                        f -> f.idAsesorMerito() == null ? -1L : f.idAsesorMerito(),
                        LinkedHashMap::new, Collectors.toList()));

        List<AsesorFila> resultado = new ArrayList<>(porAsesor.size());
        for (Map.Entry<Long, List<VentaResumenDiarioFila>> e : porAsesor.entrySet()) {
            List<VentaResumenDiarioFila> delAsesor = e.getValue();
            Long idAsesor = e.getKey() == -1L ? null : e.getKey();
            String nombre = idAsesor == null ? "#N/A" : delAsesor.get(0).nombreAsesorMerito();
            resultado.add(new AsesorFila(idAsesor, nombre, delAsesor.size(), construirTipificaciones(delAsesor)));
        }
        resultado.sort(Comparator.comparingLong(AsesorFila::total).reversed()
                .thenComparing(a -> a.nombreAsesor() == null ? "" : a.nombreAsesor()));
        return resultado;
    }

    /** Ordena las celdas por orden de matriz asc; los buckets especiales (orden null) van al final. */
    private static Comparator<CeldaTipi> comparadorCeldas() {
        return Comparator.comparing(
                (CeldaTipi c) -> c.orden() == null ? Integer.MAX_VALUE : c.orden())
                .thenComparing(CeldaTipi::clave);
    }
}
