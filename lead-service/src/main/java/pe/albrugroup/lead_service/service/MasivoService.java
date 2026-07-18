package pe.albrugroup.lead_service.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.albrugroup.lead_service.configuration.CurrentUser;
import pe.albrugroup.lead_service.configuration.OperationalDateTime;
import pe.albrugroup.lead_service.entity.enums.CampoTipificacion;
import pe.albrugroup.lead_service.entity.enums.Etapa;
import pe.albrugroup.lead_service.entity.enums.EstadoSeguimiento;
import pe.albrugroup.lead_service.entity.enums.TipoGrupoGtr;
import pe.albrugroup.lead_service.entity.request.PageRequest;
import pe.albrugroup.lead_service.entity.response.LeadGtrAgrupacionItemResponse;
import pe.albrugroup.lead_service.entity.response.LeadGtrAgrupacionesResponse;
import pe.albrugroup.lead_service.entity.response.LeadGtrResponse;
import pe.albrugroup.lead_service.entity.response.PageResponse;
import pe.albrugroup.lead_service.exception.BadRequestException;
import pe.albrugroup.lead_service.repository.LeadRepository;
import pe.albrugroup.lead_service.repository.projection.LeadGtrAgrupacionProjection;

import java.time.Instant;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class MasivoService {

    private static final List<Long> EQUIPOS_FILTRO_VACIO = List.of(-1L);
    private static final List<String> CODIGOS_FILTRO_VACIO = List.of("__SIN_CODIGO__");
    // La bandeja historica ya esta acotada a leads en PREVENTA. No excluimos codigos reales:
    // PREVENTA + INCOMPLETA/DESAPROBADA deben poder buscarse, y PREVENTA + COMPLETA ya no aparece
    // porque el lead avanzo de etapa.
    private static final List<String> TIPIFICACIONES_EXCLUIDAS_MASIVO = CODIGOS_FILTRO_VACIO;
    private static final DateTimeFormatter ETIQUETA_FECHA = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    private final LeadRepository leadRepository;
    private final PaginationService paginationService;
    private final LeadAsignacionCounterService leadAsignacionCounterService;
    private final CurrentUser currentUser;

    private static final Map<String, String> MASIVO_SORT_FIELDS = Map.of(
            "lastEntryAt", "lastEntryAt",
            "createdAt", "createdAt",
            "id", "id",
            "lead", "lead",
            "nombreAsesorAsignado", "nombreAsesorAsignado",
            "estado", "estado",
            "codigoTipificacion", "codigoTipificacion"
    );

    public PageResponse<LeadGtrResponse> listarLeads(
            Long idProveedor,
            Etapa etapa,
            List<String> codigosTipificacion,
            List<String> codigosSubtipificacion,
            CampoTipificacion campoTipificacion,
            LocalDate fechaDesde,
            LocalDate fechaHasta,
            TipoGrupoGtr tipoGrupo,
            EstadoSeguimiento estadoGrupo,
            String codigoTipificacion,
            String codigoSubtipificacion,
            LocalDate fechaIngreso,
            boolean sinValor,
            PageRequest pageRequest
    ) {
        CampoTipificacion campoResuelto = resolverCampoTipificacion(campoTipificacion);
        TipoGrupoGtr tipoTipificacionGrupo = tipoGrupoTipificacion(campoResuelto);
        FiltrosMasivo filtros = prepararFiltros(
                null, Etapa.PREVENTA, codigosTipificacion, codigosSubtipificacion, fechaDesde, fechaHasta);
        validarFiltroAgrupacionMasivo(tipoGrupo, estadoGrupo, codigoTipificacion, fechaIngreso, sinValor, tipoTipificacionGrupo);
        RangoFechas rangoIngreso = resolverRangoIngreso(fechaIngreso);
        EquipoScope equipos = resolverEquiposActuales();

        var leads = leadRepository.listarLeadsMasivo(
                filtros.filtrarProveedor(),
                filtros.idProveedorParam(),
                filtros.filtrarEtapa(),
                filtros.etapaParam(),
                filtros.filtrarTipificaciones(),
                filtros.codigosTipificacionParam(),
                filtros.filtrarSubtipificaciones(),
                filtros.codigosSubtipificacionParam(),
                TIPIFICACIONES_EXCLUIDAS_MASIVO,
                equipos.filtrar(),
                equipos.ids(),
                filtros.filtrarFechaDesde(),
                filtros.fechaDesdeParam(),
                filtros.filtrarFechaHasta(),
                filtros.fechaHastaParam(),
                Etapa.PREVENTA,
                campoResuelto == CampoTipificacion.PRIMERA,
                campoResuelto == CampoTipificacion.MAYOR,
                campoResuelto == CampoTipificacion.ULTIMA,
                tipoGrupo == TipoGrupoGtr.ESTADO,
                estadoGrupo,
                tipoGrupo == TipoGrupoGtr.PRIMERA_TIPIFICACION,
                tipoGrupo == TipoGrupoGtr.MAYOR_TIPIFICACION,
                tipoGrupo == TipoGrupoGtr.ULTIMA_TIPIFICACION,
                normalizarCodigoAgrupacion(codigoTipificacion),
                normalizarCodigoAgrupacion(codigoSubtipificacion),
                tipoGrupo == TipoGrupoGtr.INGRESO,
                rangoIngreso.inicio(),
                rangoIngreso.fin(),
                sinValor,
                paginationService.toPageableWithMapping(pageRequest, MASIVO_SORT_FIELDS)
        );
        var totales = leadAsignacionCounterService.contarAsignacionesPorLeadIds(
                leads.getContent().stream().map(LeadGtrResponse::getId).toList()
        );
        leads.getContent().forEach(lead -> {
            long totalAsignaciones = totales.getOrDefault(lead.getId(), 0L);
            lead.setTotalAsignaciones(totalAsignaciones);
        });
        return PageResponse.from(leads);
    }

    public LeadGtrAgrupacionesResponse listarAgrupaciones(
            Long idProveedor,
            Etapa etapa,
            List<String> codigosTipificacion,
            List<String> codigosSubtipificacion,
            CampoTipificacion campoTipificacion,
            LocalDate fechaDesde,
            LocalDate fechaHasta
    ) {
        CampoTipificacion campoResuelto = resolverCampoTipificacion(campoTipificacion);
        FiltrosMasivo filtros = prepararFiltros(
                null, Etapa.PREVENTA, codigosTipificacion, codigosSubtipificacion, fechaDesde, fechaHasta);
        EquipoScope equipos = resolverEquiposActuales();
        List<LeadGtrAgrupacionItemResponse> tipificaciones = mapearAgrupacionesTipificacion(
                agruparPorCampoTipificacion(campoResuelto, filtros, equipos)
        );
        return new LeadGtrAgrupacionesResponse(
                List.of(),
                List.of(),
                List.of(),
                mapearAgrupaciones(
                        leadRepository.agruparLeadsMasivoPorEstado(
                                filtros.filtrarProveedor(),
                                filtros.idProveedorParam(),
                                filtros.filtrarEtapa(),
                                filtros.etapaParam(),
                                filtros.filtrarTipificaciones(),
                                filtros.codigosTipificacionParam(),
                                filtros.filtrarSubtipificaciones(),
                                filtros.codigosSubtipificacionParam(),
                                TIPIFICACIONES_EXCLUIDAS_MASIVO,
                                equipos.filtrar(),
                                equipos.ids(),
                                filtros.filtrarFechaDesde(),
                                filtros.fechaDesdeParam(),
                                filtros.filtrarFechaHasta(),
                                filtros.fechaHastaParam(),
                                Etapa.PREVENTA,
                                campoResuelto == CampoTipificacion.PRIMERA,
                                campoResuelto == CampoTipificacion.MAYOR,
                                campoResuelto == CampoTipificacion.ULTIMA
                        ),
                        "Sin estado"
                ),
                campoResuelto == CampoTipificacion.PRIMERA ? tipificaciones : List.of(),
                campoResuelto == CampoTipificacion.MAYOR ? tipificaciones : List.of(),
                campoResuelto == CampoTipificacion.ULTIMA ? tipificaciones : List.of(),
                mapearAgrupacionesIngreso(
                        leadRepository.agruparLeadsMasivoPorIngreso(
                                filtros.filtrarProveedor(),
                                filtros.idProveedorParam(),
                                filtros.filtrarEtapa(),
                                filtros.etapaParam().name(),
                                filtros.filtrarTipificaciones(),
                                filtros.codigosTipificacionParam(),
                                filtros.filtrarSubtipificaciones(),
                                filtros.codigosSubtipificacionParam(),
                                TIPIFICACIONES_EXCLUIDAS_MASIVO,
                                equipos.filtrar(),
                                equipos.ids(),
                                filtros.filtrarFechaDesde(),
                                filtros.fechaDesdeParam(),
                                filtros.filtrarFechaHasta(),
                                filtros.fechaHastaParam(),
                                Etapa.PREVENTA.name(),
                                campoResuelto == CampoTipificacion.PRIMERA,
                                campoResuelto == CampoTipificacion.MAYOR,
                                campoResuelto == CampoTipificacion.ULTIMA
                        )
                ),
                // La vista masiva no usa el total de registros del día (es exclusivo de "Leads del día").
                null
        );
    }

    private CampoTipificacion resolverCampoTipificacion(CampoTipificacion campoTipificacion) {
        return campoTipificacion == null ? CampoTipificacion.ULTIMA : campoTipificacion;
    }

    private TipoGrupoGtr tipoGrupoTipificacion(CampoTipificacion campoTipificacion) {
        return switch (campoTipificacion) {
            case PRIMERA -> TipoGrupoGtr.PRIMERA_TIPIFICACION;
            case MAYOR -> TipoGrupoGtr.MAYOR_TIPIFICACION;
            case ULTIMA -> TipoGrupoGtr.ULTIMA_TIPIFICACION;
        };
    }

    private List<LeadGtrAgrupacionProjection> agruparPorCampoTipificacion(
            CampoTipificacion campoTipificacion,
            FiltrosMasivo filtros,
            EquipoScope equipos
    ) {
        return switch (campoTipificacion) {
            case PRIMERA -> leadRepository.agruparLeadsMasivoPorPrimeraTipificacion(
                    filtros.filtrarProveedor(),
                    filtros.idProveedorParam(),
                    filtros.filtrarEtapa(),
                    filtros.etapaParam(),
                    filtros.filtrarTipificaciones(),
                    filtros.codigosTipificacionParam(),
                    filtros.filtrarSubtipificaciones(),
                    filtros.codigosSubtipificacionParam(),
                    TIPIFICACIONES_EXCLUIDAS_MASIVO,
                    equipos.filtrar(),
                    equipos.ids(),
                    filtros.filtrarFechaDesde(),
                    filtros.fechaDesdeParam(),
                    filtros.filtrarFechaHasta(),
                    filtros.fechaHastaParam(),
                    Etapa.PREVENTA
            );
            case MAYOR -> leadRepository.agruparLeadsMasivoPorMayorTipificacion(
                    filtros.filtrarProveedor(),
                    filtros.idProveedorParam(),
                    filtros.filtrarEtapa(),
                    filtros.etapaParam(),
                    filtros.filtrarTipificaciones(),
                    filtros.codigosTipificacionParam(),
                    filtros.filtrarSubtipificaciones(),
                    filtros.codigosSubtipificacionParam(),
                    TIPIFICACIONES_EXCLUIDAS_MASIVO,
                    equipos.filtrar(),
                    equipos.ids(),
                    filtros.filtrarFechaDesde(),
                    filtros.fechaDesdeParam(),
                    filtros.filtrarFechaHasta(),
                    filtros.fechaHastaParam(),
                    Etapa.PREVENTA
            );
            case ULTIMA -> leadRepository.agruparLeadsMasivoPorUltimaTipificacion(
                    filtros.filtrarProveedor(),
                    filtros.idProveedorParam(),
                    filtros.filtrarEtapa(),
                    filtros.etapaParam(),
                    filtros.filtrarTipificaciones(),
                    filtros.codigosTipificacionParam(),
                    filtros.filtrarSubtipificaciones(),
                    filtros.codigosSubtipificacionParam(),
                    TIPIFICACIONES_EXCLUIDAS_MASIVO,
                    equipos.filtrar(),
                    equipos.ids(),
                    filtros.filtrarFechaDesde(),
                    filtros.fechaDesdeParam(),
                    filtros.filtrarFechaHasta(),
                    filtros.fechaHastaParam(),
                    Etapa.PREVENTA
            );
        };
    }

    private FiltrosMasivo prepararFiltros(
            Long idProveedor,
            Etapa etapa,
            List<String> codigosTipificacion,
            List<String> codigosSubtipificacion,
            LocalDate fechaDesde,
            LocalDate fechaHasta
    ) {
        List<String> tipificacionesFiltro = normalizarCodigos(codigosTipificacion);
        List<String> subtipificacionesFiltro = normalizarCodigos(codigosSubtipificacion);
        RangoFechas rangoFechas = resolverRangoFechas(fechaDesde, fechaHasta);
        boolean filtrarProveedor = idProveedor != null;
        boolean filtrarEtapa = etapa != null;
        boolean filtrarFechaDesde = rangoFechas.inicio() != null;
        boolean filtrarFechaHasta = rangoFechas.fin() != null;
        return new FiltrosMasivo(
                filtrarProveedor,
                filtrarProveedor ? idProveedor : -1L,
                filtrarEtapa,
                filtrarEtapa ? etapa : Etapa.PREVENTA,
                !tipificacionesFiltro.isEmpty(),
                tipificacionesFiltro.isEmpty() ? CODIGOS_FILTRO_VACIO : tipificacionesFiltro,
                !subtipificacionesFiltro.isEmpty(),
                subtipificacionesFiltro.isEmpty() ? CODIGOS_FILTRO_VACIO : subtipificacionesFiltro,
                filtrarFechaDesde,
                filtrarFechaDesde ? rangoFechas.inicio() : Instant.EPOCH,
                filtrarFechaHasta,
                filtrarFechaHasta ? rangoFechas.fin() : Instant.EPOCH
        );
    }

    private List<String> normalizarCodigos(List<String> codigos) {
        if (codigos == null) { return List.of(); }

        return codigos.stream()
                .map(this::normalizarCodigoAgrupacion)
                .filter(codigo -> codigo != null && !codigo.isBlank())
                .distinct()
                .toList();
    }

    private RangoFechas resolverRangoFechas(LocalDate fechaDesde, LocalDate fechaHasta) {
        if (fechaDesde == null && fechaHasta == null) {
            return new RangoFechas(null, null);
        }
        if (fechaDesde == null) {
            throw new BadRequestException(
                    "Periodo invalido: fechaHasta requiere fechaDesde",
                    null,
                    Map.of("fechaHasta", fechaHasta)
            );
        }

        LocalDate fechaHastaResuelta = fechaHasta == null ? OperationalDateTime.today() : fechaHasta;
        if (fechaDesde.isAfter(fechaHastaResuelta)) {
            throw new BadRequestException(
                    "Periodo invalido: fechaDesde no puede ser mayor que fechaHasta",
                    null,
                    Map.of(
                            "fechaDesde", fechaDesde,
                            "fechaHasta", fechaHastaResuelta
                    )
            );
        }

        Instant inicio = OperationalDateTime.startOfDay(fechaDesde);
        Instant fin = OperationalDateTime.endExclusiveOfDay(fechaHastaResuelta);
        return new RangoFechas(inicio, fin);
    }

    private RangoFechas resolverRangoIngreso(LocalDate fechaIngreso) {
        if (fechaIngreso == null) {
            return new RangoFechas(Instant.EPOCH, Instant.EPOCH);
        }
        return new RangoFechas(
                OperationalDateTime.startOfDay(fechaIngreso),
                OperationalDateTime.endExclusiveOfDay(fechaIngreso)
        );
    }

    private void validarFiltroAgrupacionMasivo(
            TipoGrupoGtr tipoGrupo,
            EstadoSeguimiento estadoGrupo,
            String codigoTipificacion,
            LocalDate fechaIngreso,
            boolean sinValor,
            TipoGrupoGtr tipoTipificacionGrupo
    ) {
        if (tipoGrupo == null) {
            if (estadoGrupo != null || codigoTipificacion != null || fechaIngreso != null || sinValor) {
                throw new BadRequestException("Debes indicar el tipo de agrupacion para filtrar historicos");
            }
            return;
        }

        if (sinValor) {
            return;
        }

        if (tipoGrupo == TipoGrupoGtr.ESTADO && estadoGrupo == null) {
            throw new BadRequestException("Debes indicar el estado seleccionado");
        }

        if (tipoGrupo == tipoTipificacionGrupo && normalizarCodigoAgrupacion(codigoTipificacion) == null) {
            throw new BadRequestException("Debes indicar la tipificacion seleccionada");
        }

        if (tipoGrupo == TipoGrupoGtr.INGRESO && fechaIngreso == null) {
            throw new BadRequestException("Debes indicar el ingreso seleccionado");
        }

        if (tipoGrupo != TipoGrupoGtr.ESTADO
                && tipoGrupo != tipoTipificacionGrupo
                && tipoGrupo != TipoGrupoGtr.INGRESO) {
            throw new BadRequestException("Agrupacion no disponible para historicos");
        }
    }

    private String normalizarCodigoAgrupacion(String codigo) {
        if (codigo == null || codigo.isBlank()) {
            return null;
        }
        return codigo.trim();
    }

    private List<LeadGtrAgrupacionItemResponse> mapearAgrupaciones(
            List<LeadGtrAgrupacionProjection> rows,
            String etiquetaSinValor
    ) {
        Map<Long, Long> cantidades = new LinkedHashMap<>();
        Map<Long, String> etiquetas = new LinkedHashMap<>();
        long sinValorCantidad = 0;
        for (LeadGtrAgrupacionProjection row : rows) {
            if (row.getEtiqueta() == null || row.getEtiqueta().isBlank()) {
                sinValorCantidad += row.getCantidad();
                continue;
            }
            long key = row.getEtiqueta().hashCode();
            cantidades.merge(key, row.getCantidad(), Long::sum);
            etiquetas.put(key, row.getEtiqueta());
        }

        List<LeadGtrAgrupacionItemResponse> agrupaciones = new ArrayList<>();
        cantidades.forEach((idGrupo, cantidad) -> agrupaciones.add(new LeadGtrAgrupacionItemResponse(
                null,
                null,
                null,
                etiquetas.getOrDefault(idGrupo, "Sin nombre"),
                cantidad,
                false
        )));
        if (sinValorCantidad > 0) {
            agrupaciones.add(new LeadGtrAgrupacionItemResponse(
                    null,
                    null,
                    null,
                    etiquetaSinValor,
                    sinValorCantidad,
                    true
            ));
        }
        return ordenarAgrupaciones(agrupaciones);
    }

    private List<LeadGtrAgrupacionItemResponse> mapearAgrupacionesTipificacion(
            List<LeadGtrAgrupacionProjection> rows
    ) {
        List<LeadGtrAgrupacionItemResponse> agrupaciones = new ArrayList<>();
        long sinTipificar = 0;
        for (LeadGtrAgrupacionProjection row : rows) {
            String tipificacion = normalizarCodigoAgrupacion(row.getCodigoTipificacion());
            String subtipificacion = normalizarCodigoAgrupacion(row.getCodigoSubtipificacion());
            if (tipificacion == null) {
                sinTipificar += row.getCantidad();
                continue;
            }
            agrupaciones.add(new LeadGtrAgrupacionItemResponse(
                    null,
                    tipificacion,
                    subtipificacion,
                    tipificacion + (subtipificacion == null ? "" : " / " + subtipificacion),
                    row.getCantidad(),
                    false
            ));
        }
        if (sinTipificar > 0) {
            agrupaciones.add(new LeadGtrAgrupacionItemResponse(
                    null,
                    null,
                    null,
                    "Sin tipificar",
                    sinTipificar,
                    true
            ));
        }
        return ordenarAgrupaciones(agrupaciones);
    }

    private List<LeadGtrAgrupacionItemResponse> mapearAgrupacionesIngreso(
            List<LeadGtrAgrupacionProjection> rows
    ) {
        List<LeadGtrAgrupacionItemResponse> agrupaciones = new ArrayList<>();
        long sinIngreso = 0;
        for (LeadGtrAgrupacionProjection row : rows) {
            String valor = normalizarCodigoAgrupacion(row.getEtiqueta());
            if (valor == null) {
                sinIngreso += row.getCantidad();
                continue;
            }
            agrupaciones.add(new LeadGtrAgrupacionItemResponse(
                    null,
                    null,
                    null,
                    etiquetaIngreso(valor),
                    row.getCantidad(),
                    false,
                    valor
            ));
        }
        if (sinIngreso > 0) {
            agrupaciones.add(new LeadGtrAgrupacionItemResponse(
                    null,
                    null,
                    null,
                    "Sin ingreso",
                    sinIngreso,
                    true
            ));
        }
        return ordenarAgrupaciones(agrupaciones);
    }

    private String etiquetaIngreso(String valor) {
        try {
            return LocalDate.parse(valor).format(ETIQUETA_FECHA);
        } catch (DateTimeParseException ignored) {
            return valor;
        }
    }

    private List<LeadGtrAgrupacionItemResponse> ordenarAgrupaciones(
            List<LeadGtrAgrupacionItemResponse> agrupaciones
    ) {
        return agrupaciones.stream()
                .sorted(Comparator.comparingLong(LeadGtrAgrupacionItemResponse::getCantidad)
                        .reversed()
                        .thenComparing(
                                LeadGtrAgrupacionItemResponse::getEtiqueta,
                                String.CASE_INSENSITIVE_ORDER
                        ))
                .toList();
    }

    private EquipoScope resolverEquiposActuales() {
        if (currentUser.tieneVisibilidadGlobalEquipos()) {
            return new EquipoScope(false, EQUIPOS_FILTRO_VACIO);
        }
        List<Long> equiposUsuario = currentUser.equipos();
        if (equiposUsuario == null || equiposUsuario.isEmpty()) {
            return new EquipoScope(true, EQUIPOS_FILTRO_VACIO);
        }
        return new EquipoScope(true, equiposUsuario);
    }

    private record RangoFechas(Instant inicio, Instant fin) {
    }

    private record EquipoScope(boolean filtrar, List<Long> ids) {
    }

    private record FiltrosMasivo(
            boolean filtrarProveedor,
            Long idProveedorParam,
            boolean filtrarEtapa,
            Etapa etapaParam,
            boolean filtrarTipificaciones,
            List<String> codigosTipificacionParam,
            boolean filtrarSubtipificaciones,
            List<String> codigosSubtipificacionParam,
            boolean filtrarFechaDesde,
            Instant fechaDesdeParam,
            boolean filtrarFechaHasta,
            Instant fechaHastaParam
    ) {
    }
}
