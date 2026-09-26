package pe.albrugroup.lead_service.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.albrugroup.lead_service.configuration.OperationalDateTime;
import pe.albrugroup.lead_service.entity.Campana;
import pe.albrugroup.lead_service.entity.GastoCampana;
import pe.albrugroup.lead_service.entity.enums.Accion;
import pe.albrugroup.lead_service.entity.enums.Etapa;
import pe.albrugroup.lead_service.entity.request.ActualizarGastoCampanaRequest;
import pe.albrugroup.lead_service.entity.request.CampanaGastoRequest;
import pe.albrugroup.lead_service.entity.response.CampanaGastoCampanaResumenResponse;
import pe.albrugroup.lead_service.entity.response.CampanaGastoRegistroEstadoResponse;
import pe.albrugroup.lead_service.entity.response.CampanaGastoResponse;
import pe.albrugroup.lead_service.entity.response.CampanaGastoResumenDiarioResponse;
import pe.albrugroup.lead_service.entity.response.CampanaGastoResumenMensualResponse;
import pe.albrugroup.lead_service.entity.response.CampanaGastoResumenPeriodoResponse;
import pe.albrugroup.lead_service.exception.BadRequestException;
import pe.albrugroup.lead_service.exception.NotFoundException;
import pe.albrugroup.lead_service.repository.CampanaRepository;
import pe.albrugroup.lead_service.repository.EventoRepository;
import pe.albrugroup.lead_service.repository.GastoCampanaRepository;
import pe.albrugroup.lead_service.repository.LeadEtapaResumenRepository;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class CampanaGastoService {

    private static final String TIPIFICACION_PREVENTA = "PREVENTA";
    private static final String TIPIFICACION_INSTALADO = "INSTALADO";

    private final GastoCampanaRepository registroRepository;
    private final CampanaRepository campanaRepository;
    private final EventoRepository eventoRepository;
    private final LeadEtapaResumenRepository leadEtapaResumenRepository;

    @Transactional
    public CampanaGastoResponse registrarGasto(Long idCampana, CampanaGastoRequest request) {
        Campana campana = obtenerCampanaActivaParaRegistro(idCampana);
        validarReportedAt(campana, request.getReportedAt());
        validarOrdenYLeads(idCampana, request.getReportedAt(), request.getLeadsReportados());

        GastoCampana registro = GastoCampana.builder()
                .campana(campana)
                .leadsReportados(request.getLeadsReportados())
                .leadsReales(0)
                .cantidadPreventas(0)
                .cantidadVentas(0)
                .costoTotal(request.getCostoTotal())
                .reportedAt(request.getReportedAt())
                .build();
        GastoCampana saved = registroRepository.saveAndFlush(registro);
        aplicarMetricasActuales(saved);
        return toRegistroResponse(registroRepository.save(saved));
    }

    @Transactional
    public CampanaGastoResponse actualizarGasto(
            Long idCampana,
            Long idGasto,
            ActualizarGastoCampanaRequest request
    ) {
        Campana campana = obtenerCampanaActivaParaRegistro(idCampana);
        GastoCampana registro = registroRepository.findByIdAndCampanaId(idGasto, idCampana)
                .orElseThrow(() -> new NotFoundException(GastoCampana.class, idGasto));
        GastoCampana ultimo = ultimoRegistroDelDia(idCampana, registro.getReportedAt().toLocalDate());
        if (!Objects.equals(ultimo.getId(), registro.getId())) {
            throw new BadRequestException("Solo se puede editar el ultimo gasto del dia.");
        }

        registro.setCampana(campana);
        registro.setLeadsReportados(request.getLeadsReportados());
        registro.setCostoTotal(request.getCostoTotal());
        validarLeadsContraRegistroAnterior(idCampana, registro);
        aplicarMetricasActuales(registro);
        return toRegistroResponse(registroRepository.saveAndFlush(registro));
    }

    public CampanaGastoRegistroEstadoResponse obtenerEstadoRegistro(Long idCampana, LocalDate fecha) {
        Campana campana = obtenerCampanaActiva(idCampana);
        LocalDate fechaTrabajo = resolverFecha(fecha);
        RangoFechas rango = rangoDia(fechaTrabajo);
        GastoCampana ultimo = registroRepository
                .findTopByCampanaIdAndReportedAtGreaterThanEqualAndReportedAtLessThanOrderByReportedAtDescIdDesc(
                        idCampana, rango.inicio(), rango.fin())
                .orElse(null);
        LocalDate fechaMinima = campana.getCreatedAt() == null
                ? null
                : OperationalDateTime.toOperationalDate(campana.getCreatedAt());
        return CampanaGastoRegistroEstadoResponse.builder()
                .esPrimerRegistroDelDia(ultimo == null)
                .fechaMinima(fechaMinima)
                .fechaMaxima(OperationalDateTime.today())
                .ultimoReportedAt(ultimo == null ? null : ultimo.getReportedAt())
                .build();
    }

    public List<CampanaGastoResponse> listarRegistrosDia(Long idCampana, LocalDate fecha) {
        obtenerCampanaActiva(idCampana);
        RangoFechas rango = rangoDia(resolverFecha(fecha));
        return registroRepository
                .findByCampanaIdAndReportedAtGreaterThanEqualAndReportedAtLessThanOrderByReportedAtAscIdAsc(
                        idCampana, rango.inicio(), rango.fin())
                .stream()
                .map(this::toRegistroResponse)
                .toList();
    }

    public List<CampanaGastoResponse> listarCierresDiariosPeriodo(
            Long idCampana, LocalDate fechaDesde, LocalDate fechaHasta) {
        obtenerCampanaActiva(idCampana);
        validarPeriodo(fechaDesde, fechaHasta);
        if (fechaDesde.equals(fechaHasta)) {
            return listarRegistrosDia(idCampana, fechaDesde);
        }
        RangoFechas rango = rangoPeriodo(fechaDesde, fechaHasta);
        return ultimosPorDia(registroRepository
                .findByCampanaIdAndReportedAtGreaterThanEqualAndReportedAtLessThanOrderByReportedAtAscIdAsc(
                        idCampana, rango.inicio(), rango.fin()))
                .values().stream().map(this::toRegistroResponse).toList();
    }

    public CampanaGastoResumenDiarioResponse obtenerResumenDiarioCampana(Long idCampana, LocalDate fecha) {
        Campana campana = obtenerCampanaActiva(idCampana);
        LocalDate fechaTrabajo = resolverFecha(fecha);
        RangoFechas rango = rangoDia(fechaTrabajo);
        GastoCampana ultimo = ultimoRegistro(registroRepository
                .findByCampanaIdAndReportedAtGreaterThanEqualAndReportedAtLessThanOrderByReportedAtAscIdAsc(
                        idCampana, rango.inicio(), rango.fin()));
        return resumenDiario(campana, fechaTrabajo, toCampanaResumen(campana, ultimo));
    }

    public CampanaGastoResumenDiarioResponse obtenerResumenDiarioGlobal(LocalDate fecha) {
        return obtenerResumenDiarioGlobal(fecha, null);
    }

    public CampanaGastoResumenDiarioResponse obtenerResumenDiarioGlobal(LocalDate fecha, Long idProveedor) {
        LocalDate fechaTrabajo = resolverFecha(fecha);
        List<CampanaGastoCampanaResumenResponse> campanas = ultimosPorCampana(
                registrosPorPeriodo(rangoDia(fechaTrabajo), idProveedor))
                .values().stream().toList();
        return CampanaGastoResumenDiarioResponse.builder()
                .fecha(fechaTrabajo)
                .leadsReportados(totalLeads(campanas))
                .leadsReales(totalLeadsReales(campanas))
                .cantidadPreventas(totalPreventas(campanas))
                .cantidadVentas(totalVentas(campanas))
                .costoTotal(totalCosto(campanas))
                .ultimoReportedAt(ultimoReportedAt(campanas))
                .campanas(campanas)
                .build();
    }

    public CampanaGastoResumenMensualResponse obtenerResumenMensualCampana(Long idCampana, Integer anio, Integer mes) {
        Campana campana = obtenerCampanaActiva(idCampana);
        YearMonth periodo = resolverPeriodo(anio, mes);
        RangoFechas rango = rangoMes(periodo);
        List<GastoCampana> registros = registroRepository
                .findByCampanaIdAndReportedAtGreaterThanEqualAndReportedAtLessThanOrderByReportedAtAscIdAsc(
                        idCampana, rango.inicio(), rango.fin());
        CampanaGastoCampanaResumenResponse resumen = resumenPeriodoCampana(campana, registros);
        return CampanaGastoResumenMensualResponse.builder()
                .idCampana(campana.getId()).nombreCampana(campana.getNombre())
                .anio(periodo.getYear()).mes(periodo.getMonthValue())
                .leadsReportados(resumen.getLeadsReportados()).leadsReales(resumen.getLeadsReales())
                .cantidadPreventas(resumen.getCantidadPreventas()).cantidadVentas(resumen.getCantidadVentas())
                .costoTotal(resumen.getCostoTotal()).ultimoReportedAt(resumen.getUltimoReportedAt())
                .build();
    }

    public CampanaGastoResumenMensualResponse obtenerResumenMensualGlobal(Integer anio, Integer mes) {
        return obtenerResumenMensualGlobal(anio, mes, null);
    }

    public CampanaGastoResumenMensualResponse obtenerResumenMensualGlobal(Integer anio, Integer mes, Long idProveedor) {
        YearMonth periodo = resolverPeriodo(anio, mes);
        List<CampanaGastoCampanaResumenResponse> campanas = registrosPorCampana(
                registrosPorPeriodo(rangoMes(periodo), idProveedor)).values().stream()
                .map(registros -> resumenPeriodoCampana(registros.get(0).getCampana(), registros)).toList();
        return CampanaGastoResumenMensualResponse.builder()
                .anio(periodo.getYear()).mes(periodo.getMonthValue())
                .leadsReportados(totalLeads(campanas)).leadsReales(totalLeadsReales(campanas))
                .cantidadPreventas(totalPreventas(campanas)).cantidadVentas(totalVentas(campanas))
                .costoTotal(totalCosto(campanas)).ultimoReportedAt(ultimoReportedAt(campanas))
                .campanas(campanas).build();
    }

    public CampanaGastoResumenPeriodoResponse obtenerResumenPeriodoGlobal(
            LocalDate fechaDesde, LocalDate fechaHasta, Long idProveedor) {
        validarPeriodo(fechaDesde, fechaHasta);
        List<CampanaGastoCampanaResumenResponse> campanas = registrosPorCampana(
                registrosPorPeriodo(rangoPeriodo(fechaDesde, fechaHasta), idProveedor)).values().stream()
                .map(registros -> resumenPeriodoCampana(registros.get(0).getCampana(), registros)).toList();
        return CampanaGastoResumenPeriodoResponse.builder()
                .fechaDesde(fechaDesde).fechaHasta(fechaHasta)
                .leadsReportados(totalLeads(campanas)).leadsReales(totalLeadsReales(campanas))
                .cantidadPreventas(totalPreventas(campanas)).cantidadVentas(totalVentas(campanas))
                .costoTotal(totalCosto(campanas)).ultimoReportedAt(ultimoReportedAt(campanas))
                .campanas(campanas).build();
    }

    /** Recalcula solo el ultimo registro de cada dia y deja null ventas en los intermedios historicos. */
    @Transactional
    public int recalcularUltimosRegistrosHistoricos() {
        List<GastoCampana> registros = registroRepository.findAllByOrderByReportedAtAscIdAsc();
        Map<String, GastoCampana> ultimos = new LinkedHashMap<>();
        for (GastoCampana registro : registros) {
            String clave = registro.getCampana().getId() + "|" + registro.getReportedAt().toLocalDate();
            ultimos.put(clave, registro);
        }
        int recalculados = 0;
        for (GastoCampana registro : registros) {
            String clave = registro.getCampana().getId() + "|" + registro.getReportedAt().toLocalDate();
            if (ultimos.get(clave).getId().equals(registro.getId())) {
                recalcularFunnel(registro);
                recalculados++;
            } else {
                registro.setCantidadVentas(null);
            }
        }
        registroRepository.saveAllAndFlush(registros);
        return recalculados;
    }

    private void aplicarMetricasActuales(GastoCampana registro) {
        RangoFechas rango = rangoDia(registro.getReportedAt().toLocalDate());
        Instant hasta = registro.getReportedAt().atZone(OperationalDateTime.ZONE).toInstant();
        Long idCampana = registro.getCampana().getId();
        registro.setLeadsReales((int) eventoRepository.contarRegistrosPorCampanaYRango(
                idCampana, Accion.REGISTRO, rango.inicioInstant(), hasta));
        recalcularFunnel(registro);
    }

    private void recalcularFunnel(GastoCampana registro) {
        Long idCampana = registro.getCampana().getId();
        RangoFechas rango = rangoDia(registro.getReportedAt().toLocalDate());
        Instant reportadoHasta = registro.getReportedAt().atZone(OperationalDateTime.ZONE).toInstant();
        registro.setCantidadPreventas((int) leadEtapaResumenRepository.contarPreventasPorCampanaYRango(
                idCampana, Etapa.PREVENTA, TIPIFICACION_PREVENTA, rango.inicioInstant(), reportadoHasta));
        registro.setCantidadVentas((int) leadEtapaResumenRepository.contarVentasPorCampanaYRango(
                idCampana, Etapa.PREVENTA, Etapa.VENTA, TIPIFICACION_INSTALADO,
                rango.inicioInstant(), reportadoHasta));
    }

    private void validarReportedAt(Campana campana, LocalDateTime reportedAt) {
        LocalDateTime ahora = LocalDateTime.now(OperationalDateTime.ZONE);
        if (reportedAt.isAfter(ahora)) {
            throw new BadRequestException("reportedAt no puede estar en el futuro.");
        }
        if (campana.getCreatedAt() != null
                && reportedAt.toLocalDate().isBefore(OperationalDateTime.toOperationalDate(campana.getCreatedAt()))) {
            throw new BadRequestException("reportedAt no puede ser anterior a la fecha de creacion de la campana.");
        }
    }

    private void validarOrdenYLeads(Long idCampana, LocalDateTime reportedAt, Integer leads) {
        ultimoRegistroDelDiaOptional(idCampana, reportedAt.toLocalDate()).ifPresent(ultimo -> {
            if (!reportedAt.isAfter(ultimo.getReportedAt())) {
                throw new BadRequestException("reportedAt debe ser posterior al ultimo registro del dia.");
            }
            if (leads < ultimo.getLeadsReportados()) {
                throw new BadRequestException("leadsReportados no puede ser menor al ultimo registro del dia.");
            }
        });
    }

    private void validarLeadsContraRegistroAnterior(Long idCampana, GastoCampana registro) {
        List<GastoCampana> registros = registroRepository
                .findByCampanaIdAndReportedAtGreaterThanEqualAndReportedAtLessThanOrderByReportedAtAscIdAsc(
                        idCampana, rangoDia(registro.getReportedAt().toLocalDate()).inicio(),
                        rangoDia(registro.getReportedAt().toLocalDate()).fin());
        registros.stream()
                .filter(item -> !Objects.equals(item.getId(), registro.getId()))
                .filter(item -> item.getReportedAt().isBefore(registro.getReportedAt()))
                .max(Comparator.comparing(GastoCampana::getReportedAt).thenComparing(GastoCampana::getId))
                .ifPresent(anterior -> {
                    if (registro.getLeadsReportados() < anterior.getLeadsReportados()) {
                        throw new BadRequestException("leadsReportados no puede ser menor al registro anterior del dia.");
                    }
                });
    }

    private java.util.Optional<GastoCampana> ultimoRegistroDelDiaOptional(Long idCampana, LocalDate fecha) {
        RangoFechas rango = rangoDia(fecha);
        return registroRepository
                .findTopByCampanaIdAndReportedAtGreaterThanEqualAndReportedAtLessThanOrderByReportedAtDescIdDesc(
                        idCampana, rango.inicio(), rango.fin());
    }

    private GastoCampana ultimoRegistroDelDia(Long idCampana, LocalDate fecha) {
        return ultimoRegistroDelDiaOptional(idCampana, fecha)
                .orElseThrow(() -> new BadRequestException("No existe un ultimo registro para ese dia."));
    }

    private List<GastoCampana> registrosPorPeriodo(RangoFechas rango, Long idProveedor) {
        if (idProveedor == null) {
            return registroRepository.findByReportedAtGreaterThanEqualAndReportedAtLessThanOrderByReportedAtAscIdAsc(
                    rango.inicio(), rango.fin());
        }
        return registroRepository.findByCampanaProveedorIdAndReportedAtGreaterThanEqualAndReportedAtLessThanOrderByReportedAtAscIdAsc(
                idProveedor, rango.inicio(), rango.fin());
    }

    private Campana obtenerCampanaActiva(Long idCampana) {
        return campanaRepository.findByIdAndActivoTrue(idCampana)
                .orElseThrow(() -> new NotFoundException(Campana.class, idCampana));
    }

    private Campana obtenerCampanaActivaParaRegistro(Long idCampana) {
        return campanaRepository.findActiveByIdForUpdate(idCampana)
                .orElseThrow(() -> new NotFoundException(Campana.class, idCampana));
    }

    private CampanaGastoResponse toRegistroResponse(GastoCampana registro) {
        Campana campana = registro.getCampana();
        return CampanaGastoResponse.builder()
                .id(registro.getId()).idCampana(campana == null ? null : campana.getId())
                .nombreCampana(campana == null ? null : campana.getNombre())
                .leadsReportados(registro.getLeadsReportados()).leadsReales(registro.getLeadsReales())
                .cantidadPreventas(registro.getCantidadPreventas()).cantidadVentas(registro.getCantidadVentas())
                .costoTotal(registro.getCostoTotal()).reportedAt(registro.getReportedAt())
                .createdAt(registro.getCreatedAt()).updatedAt(registro.getUpdatedAt()).build();
    }

    private CampanaGastoCampanaResumenResponse toCampanaResumen(GastoCampana registro) {
        return toCampanaResumen(registro.getCampana(), registro);
    }

    private CampanaGastoCampanaResumenResponse toCampanaResumen(Campana campana, GastoCampana registro) {
        return CampanaGastoCampanaResumenResponse.builder()
                .idCampana(campana.getId()).nombreCampana(campana.getNombre())
                .leadsReportados(registro == null ? 0 : registro.getLeadsReportados())
                .leadsReales(registro == null ? 0 : registro.getLeadsReales())
                .cantidadPreventas(registro == null ? 0 : registro.getCantidadPreventas())
                .cantidadVentas(registro == null ? 0 : Objects.requireNonNullElse(registro.getCantidadVentas(), 0))
                .costoTotal(registro == null ? BigDecimal.ZERO : registro.getCostoTotal())
                .ultimoReportedAt(registro == null ? null : registro.getReportedAt()).build();
    }

    private CampanaGastoCampanaResumenResponse resumenPeriodoCampana(Campana campana, List<GastoCampana> registros) {
        List<GastoCampana> cierres = ultimosPorDia(registros).values().stream().toList();
        return CampanaGastoCampanaResumenResponse.builder()
                .idCampana(campana.getId()).nombreCampana(campana.getNombre())
                .leadsReportados(suma(cierres, GastoCampana::getLeadsReportados))
                .leadsReales(suma(cierres, GastoCampana::getLeadsReales))
                .cantidadPreventas(suma(cierres, GastoCampana::getCantidadPreventas))
                .cantidadVentas(suma(cierres, GastoCampana::getCantidadVentas))
                .costoTotal(cierres.stream().map(GastoCampana::getCostoTotal).filter(Objects::nonNull)
                        .reduce(BigDecimal.ZERO, BigDecimal::add))
                .ultimoReportedAt(cierres.stream().map(GastoCampana::getReportedAt).filter(Objects::nonNull)
                        .max(Comparator.naturalOrder()).orElse(null)).build();
    }

    private Map<Long, CampanaGastoCampanaResumenResponse> ultimosPorCampana(List<GastoCampana> registros) {
        Map<Long, CampanaGastoCampanaResumenResponse> result = new LinkedHashMap<>();
        registrosPorCampana(registros).forEach((id, items) -> result.put(id, toCampanaResumen(items.get(items.size() - 1))));
        return result;
    }

    private Map<Long, List<GastoCampana>> registrosPorCampana(List<GastoCampana> registros) {
        Map<Long, List<GastoCampana>> result = new LinkedHashMap<>();
        registros.forEach(registro -> result.computeIfAbsent(registro.getCampana().getId(), ignored -> new ArrayList<>()).add(registro));
        return result;
    }

    private Map<LocalDate, GastoCampana> ultimosPorDia(List<GastoCampana> registros) {
        Map<LocalDate, GastoCampana> result = new LinkedHashMap<>();
        registros.forEach(registro -> result.put(registro.getReportedAt().toLocalDate(), registro));
        return result;
    }

    private GastoCampana ultimoRegistro(List<GastoCampana> registros) {
        return registros.isEmpty() ? null : registros.get(registros.size() - 1);
    }

    private CampanaGastoResumenDiarioResponse resumenDiario(
            Campana campana, LocalDate fecha, CampanaGastoCampanaResumenResponse resumen) {
        return CampanaGastoResumenDiarioResponse.builder()
                .idCampana(campana.getId()).nombreCampana(campana.getNombre()).fecha(fecha)
                .leadsReportados(resumen.getLeadsReportados()).leadsReales(resumen.getLeadsReales())
                .cantidadPreventas(resumen.getCantidadPreventas()).cantidadVentas(resumen.getCantidadVentas())
                .costoTotal(resumen.getCostoTotal()).ultimoReportedAt(resumen.getUltimoReportedAt()).build();
    }

    private Integer suma(List<GastoCampana> registros, java.util.function.Function<GastoCampana, Integer> getter) {
        return registros.stream().map(getter).filter(Objects::nonNull).reduce(0, Integer::sum);
    }

    private Integer totalLeads(List<CampanaGastoCampanaResumenResponse> campanas) {
        return campanas.stream().map(CampanaGastoCampanaResumenResponse::getLeadsReportados).filter(Objects::nonNull).reduce(0, Integer::sum);
    }

    private Integer totalLeadsReales(List<CampanaGastoCampanaResumenResponse> campanas) {
        return campanas.stream().map(CampanaGastoCampanaResumenResponse::getLeadsReales).filter(Objects::nonNull).reduce(0, Integer::sum);
    }

    private Integer totalPreventas(List<CampanaGastoCampanaResumenResponse> campanas) {
        return campanas.stream().map(CampanaGastoCampanaResumenResponse::getCantidadPreventas).filter(Objects::nonNull).reduce(0, Integer::sum);
    }

    private Integer totalVentas(List<CampanaGastoCampanaResumenResponse> campanas) {
        return campanas.stream().map(CampanaGastoCampanaResumenResponse::getCantidadVentas).filter(Objects::nonNull).reduce(0, Integer::sum);
    }

    private BigDecimal totalCosto(List<CampanaGastoCampanaResumenResponse> campanas) {
        return campanas.stream().map(CampanaGastoCampanaResumenResponse::getCostoTotal).filter(Objects::nonNull).reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private LocalDateTime ultimoReportedAt(List<CampanaGastoCampanaResumenResponse> campanas) {
        return campanas.stream().map(CampanaGastoCampanaResumenResponse::getUltimoReportedAt).filter(Objects::nonNull).max(Comparator.naturalOrder()).orElse(null);
    }

    private void validarPeriodo(LocalDate desde, LocalDate hasta) {
        if (desde == null || hasta == null || desde.isAfter(hasta)) {
            throw new BadRequestException("La fecha Desde no puede ser posterior a la fecha Hasta.");
        }
    }

    private LocalDate resolverFecha(LocalDate fecha) {
        return OperationalDateTime.resolveDate(fecha);
    }

    private YearMonth resolverPeriodo(Integer anio, Integer mes) {
        if (anio == null && mes == null) return OperationalDateTime.currentMonth();
        if (anio == null || mes == null) throw new BadRequestException("anio y mes deben enviarse juntos");
        if (mes < 1 || mes > 12) throw new BadRequestException("mes debe estar entre 1 y 12");
        return YearMonth.of(anio, mes);
    }

    private RangoFechas rangoDia(LocalDate fecha) {
        return rangoPeriodo(fecha, fecha);
    }

    private RangoFechas rangoMes(YearMonth periodo) {
        return new RangoFechas(periodo.atDay(1).atStartOfDay(), periodo.plusMonths(1).atDay(1).atStartOfDay(),
                periodo.atDay(1).atStartOfDay(OperationalDateTime.ZONE).toInstant(),
                periodo.plusMonths(1).atDay(1).atStartOfDay(OperationalDateTime.ZONE).toInstant());
    }

    private RangoFechas rangoPeriodo(LocalDate desde, LocalDate hasta) {
        return new RangoFechas(desde.atStartOfDay(), hasta.plusDays(1).atStartOfDay(),
                OperationalDateTime.startOfDay(desde), OperationalDateTime.endExclusiveOfDay(hasta));
    }

    private record RangoFechas(LocalDateTime inicio, LocalDateTime fin, Instant inicioInstant, Instant finInstant) {
    }
}
