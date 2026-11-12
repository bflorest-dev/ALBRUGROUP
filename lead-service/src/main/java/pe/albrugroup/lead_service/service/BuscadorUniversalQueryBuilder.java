package pe.albrugroup.lead_service.service;

import pe.albrugroup.lead_service.entity.enums.AnclaFechaBuscador;
import pe.albrugroup.lead_service.entity.enums.ColumnaUniversal;
import pe.albrugroup.lead_service.entity.enums.ColumnaUniversal.Fuente;
import pe.albrugroup.lead_service.entity.request.BuscadorUniversalFilter;

import java.util.ArrayList;
import java.util.Collections;
import java.util.EnumMap;
import java.util.EnumSet;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

class BuscadorUniversalQueryBuilder {

    private static final Map<Fuente, String> JOIN_FRAGMENTS;

    static {
        Map<Fuente, String> m = new EnumMap<>(Fuente.class);
        m.put(Fuente.CONTACTO, " LEFT JOIN l.contacto c");
        m.put(Fuente.DATOS_PREVENTA, " LEFT JOIN l.datosPreventa dp");
        m.put(Fuente.DIRECCION, " LEFT JOIN l.direccion dir");
        m.put(Fuente.PROVEEDOR, " LEFT JOIN l.proveedor prov");
        m.put(Fuente.PROVEEDOR_ORIGEN, " LEFT JOIN l.proveedorOrigen provOrigen");
        m.put(Fuente.CAMPANA, " LEFT JOIN l.campana camp");
        m.put(Fuente.ORIGEN, " LEFT JOIN l.origen orig");
        m.put(Fuente.PLAN, " LEFT JOIN l.plan pl");
        m.put(Fuente.ZONA, " LEFT JOIN l.zona z");
        m.put(Fuente.SEGUIMIENTO, " LEFT JOIN LeadSeguimiento seg ON seg.idLead = l.id");
        m.put(Fuente.ETAPA_RESUMEN, " LEFT JOIN LeadEtapaResumen er ON er.idLead = l.id AND er.etapa = l.etapa");
        m.put(Fuente.CALENDARIO, " LEFT JOIN CalendarioFacturacionPostventa cal ON cal.lead = l");
        JOIN_FRAGMENTS = Collections.unmodifiableMap(m);
    }

    private final Set<Fuente> joins = EnumSet.noneOf(Fuente.class);
    private final StringBuilder where = new StringBuilder();
    private final Map<String, Object> params = new HashMap<>();
    private final List<ColumnaUniversal> columnasOrdenadas;

    BuscadorUniversalQueryBuilder(BuscadorUniversalFilter filter) {
        Set<ColumnaUniversal> cols = filter.getColumnas();
        if (cols == null || cols.isEmpty()) {
            this.columnasOrdenadas = List.of(
                    ColumnaUniversal.TELEFONO, ColumnaUniversal.ETAPA,
                    ColumnaUniversal.ESTADO, ColumnaUniversal.ASESOR,
                    ColumnaUniversal.PROVEEDOR, ColumnaUniversal.CAMPANA
            );
        } else {
            this.columnasOrdenadas = new ArrayList<>(cols);
            this.columnasOrdenadas.sort(null);
        }
        columnasOrdenadas.forEach(c -> requireJoin(c.getFuente()));
        buildWhere(filter);
    }

    // ── Builds ──

    String buildDataQuery() {
        var sb = new StringBuilder("SELECT l.id");
        for (ColumnaUniversal col : columnasOrdenadas) {
            sb.append(", ").append(col.getJpql());
        }
        sb.append(" FROM Lead l");
        appendJoins(sb);
        sb.append(" WHERE 1=1").append(where);
        sb.append(" ORDER BY l.id DESC");
        return sb.toString();
    }

    String buildCountQuery() {
        var sb = new StringBuilder("SELECT COUNT(l) FROM Lead l");
        appendJoins(sb);
        sb.append(" WHERE 1=1").append(where);
        return sb.toString();
    }

    Map<String, Object> getParams() {
        return params;
    }

    List<ColumnaUniversal> getColumnasOrdenadas() {
        return columnasOrdenadas;
    }

    // ── Internals ──

    private void requireJoin(Fuente fuente) {
        if (fuente != Fuente.LEAD) {
            joins.add(fuente);
        }
    }

    private void appendJoins(StringBuilder sb) {
        for (Fuente f : Fuente.values()) {
            if (joins.contains(f)) {
                String fragment = JOIN_FRAGMENTS.get(f);
                if (fragment != null) {
                    sb.append(fragment);
                }
            }
        }
    }

    private void buildWhere(BuscadorUniversalFilter f) {
        // ── Búsqueda universal (OR) ──
        if (notBlank(f.getQ())) {
            requireJoin(Fuente.DATOS_PREVENTA);
            String term = "%" + f.getQ().trim().toLowerCase() + "%";
            where.append(" AND (")
                 .append("LOWER(l.lead) LIKE :q")
                 .append(" OR LOWER(l.usermeta) LIKE :q")
                 .append(" OR LOWER(l.sec) LIKE :q")
                 .append(" OR LOWER(l.sot) LIKE :q")
                 .append(" OR LOWER(l.customerId) LIKE :q")
                 .append(" OR LOWER(dp.numeroDocumentoTitularServicio) LIKE :q")
                 .append(" OR LOWER(dp.nombreTitularServicio) LIKE :q")
                 .append(" OR LOWER(dp.celularRegistro) LIKE :q")
                 .append(")");
            params.put("q", term);
        }

        // ── Texto libre (LIKE) — filtros individuales ──
        if (notBlank(f.getTelefono())) {
            addLike("l.lead", "telefono", f.getTelefono());
        }
        if (notBlank(f.getUsermeta())) {
            addLike("l.usermeta", "usermeta", f.getUsermeta());
        }
        if (notBlank(f.getDocumento())) {
            requireJoin(Fuente.DATOS_PREVENTA);
            addLike("dp.numeroDocumentoTitularServicio", "documento", f.getDocumento());
        }
        if (notBlank(f.getNombreTitular())) {
            requireJoin(Fuente.DATOS_PREVENTA);
            addLike("dp.nombreTitularServicio", "nombreTitular", f.getNombreTitular());
        }

        // ── Enums ──
        if (f.getEtapa() != null) {
            addEquals("l.etapa", "etapa", f.getEtapa());
        }
        if (f.getEstado() != null) {
            addEquals("l.estado", "estado", f.getEstado());
        }
        if (f.getEstadoClientePostventa() != null) {
            addEquals("l.estadoClientePostventa", "estadoClPv", f.getEstadoClientePostventa());
        }

        // ── FKs ──
        if (f.getIdProveedor() != null) {
            requireJoin(Fuente.PROVEEDOR);
            addEquals("prov.id", "idProveedor", f.getIdProveedor());
        }
        if (f.getIdProveedorOrigen() != null) {
            requireJoin(Fuente.PROVEEDOR_ORIGEN);
            addEquals("provOrigen.id", "idProveedorOrigen", f.getIdProveedorOrigen());
        }
        if (f.getIdEquipo() != null) {
            addEquals("l.idEquipo", "idEquipo", f.getIdEquipo());
        }
        if (f.getIdAsesor() != null) {
            addEquals("l.idAsesorAsignado", "idAsesor", f.getIdAsesor());
        }
        if (f.getIdCampana() != null) {
            requireJoin(Fuente.CAMPANA);
            addEquals("camp.id", "idCampana", f.getIdCampana());
        }
        if (f.getIdOrigen() != null) {
            requireJoin(Fuente.ORIGEN);
            addEquals("orig.id", "idOrigen", f.getIdOrigen());
        }
        if (f.getIdPlan() != null) {
            requireJoin(Fuente.PLAN);
            addEquals("pl.id", "idPlan", f.getIdPlan());
        }
        if (f.getIdZona() != null) {
            requireJoin(Fuente.ZONA);
            addEquals("z.id", "idZona", f.getIdZona());
        }

        // ── Texto exacto ──
        if (notBlank(f.getSec())) {
            addEquals("l.sec", "sec", f.getSec().trim());
        }
        if (notBlank(f.getSot())) {
            addEquals("l.sot", "sot", f.getSot().trim());
        }
        if (notBlank(f.getCustomerId())) {
            addEquals("l.customerId", "customerId", f.getCustomerId().trim());
        }

        // ── Rango de fechas ──
        if (f.getFechaDesde() != null || f.getFechaHasta() != null) {
            AnclaFechaBuscador ancla = f.getAnclaFecha() != null ? f.getAnclaFecha() : AnclaFechaBuscador.CREATED_AT;
            requireJoin(ancla.getFuente());
            String path = ancla.getJpql();
            if (f.getFechaDesde() != null) {
                where.append(" AND ").append(path).append(" >= :fechaDesde");
                params.put("fechaDesde", f.getFechaDesde());
            }
            if (f.getFechaHasta() != null) {
                where.append(" AND ").append(path).append(" <= :fechaHasta");
                params.put("fechaHasta", f.getFechaHasta());
            }
        }

        // ── Tipificaciones (IN) ──
        if (f.getCodigosTipificacion() != null && !f.getCodigosTipificacion().isEmpty()) {
            where.append(" AND l.codigoTipificacion IN :codsTip");
            params.put("codsTip", f.getCodigosTipificacion());
        }
        if (f.getCodigosSubtipificacion() != null && !f.getCodigosSubtipificacion().isEmpty()) {
            where.append(" AND l.codigoSubtipificacion IN :codsSubtip");
            params.put("codsSubtip", f.getCodigosSubtipificacion());
        }
    }

    private void addEquals(String jpqlPath, String paramName, Object value) {
        where.append(" AND ").append(jpqlPath).append(" = :").append(paramName);
        params.put(paramName, value);
    }

    private void addLike(String jpqlPath, String paramName, String value) {
        where.append(" AND LOWER(").append(jpqlPath).append(") LIKE :").append(paramName);
        params.put(paramName, "%" + value.trim().toLowerCase() + "%");
    }

    private static boolean notBlank(String s) {
        return s != null && !s.isBlank();
    }
}
