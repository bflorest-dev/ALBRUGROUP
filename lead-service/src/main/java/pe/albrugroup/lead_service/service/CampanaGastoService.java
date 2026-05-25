package pe.albrugroup.lead_service.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.albrugroup.lead_service.entity.Campana;
import pe.albrugroup.lead_service.entity.CampanaGastoRegistro;
import pe.albrugroup.lead_service.entity.enums.Accion;
import pe.albrugroup.lead_service.entity.request.CampanaGastoRequest;
import pe.albrugroup.lead_service.entity.response.CampanaGastoCampanaResumenResponse;
import pe.albrugroup.lead_service.entity.response.CampanaGastoResponse;
import pe.albrugroup.lead_service.entity.response.CampanaGastoResumenDiarioResponse;
import pe.albrugroup.lead_service.entity.response.CampanaGastoResumenMensualResponse;
import pe.albrugroup.lead_service.exception.BadRequestException;
import pe.albrugroup.lead_service.exception.NotFoundException;
import pe.albrugroup.lead_service.repository.CampanaGastoRegistroRepository;
import pe.albrugroup.lead_service.repository.CampanaRepository;
import pe.albrugroup.lead_service.repository.EventoRepository;
import pe.albrugroup.lead_service.repository.LeadRepository;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.ZoneId;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class CampanaGastoService {

    private static final ZoneId ZONA_OPERATIVA = ZoneId.of("America/Lima");
    private static final String TIPIFICACION_PREVENTA_COMPLETA = "PREVENTA_COMPLETA";
    private static final String SUBTIPIFICACION_VENTA_CERRADA = "VENTA_CERRADA";

    private final CampanaGastoRegistroRepository registroRepository;
    private final CampanaRepository campanaRepository;
    private final LeadRepository leadRepository;
    private final EventoRepository eventoRepository;

    @Transactional
    public CampanaGastoResponse registrarGasto(Long idCampana, CampanaGastoRequest request) {
        Campana campana = obtenerCampanaActiva(idCampana);
        CampanaGastoRegistro registro = CampanaGastoRegistro.builder()
                .campana(campana)
                .leads(request.getLeads())
                .leadsReales(0)
                .ventasCerradas(0)
                .costoTotal(request.getCostoTotal())
                .build();
        CampanaGastoRegistro savedRegistro = registroRepository.saveAndFlush(registro);
        aplicarMetricasReales(savedRegistro);
        return toRegistroResponse(registroRepository.save(savedRegistro));
    }

    public List<CampanaGastoResponse> listarRegistrosDia(Long idCampana, LocalDate fecha) {
        obtenerCampanaActiva(idCampana);
        RangoFechas rango = rangoDia(resolverFecha(fecha));
        return registroRepository
                .findByCampanaIdAndCreatedAtGreaterThanEqualAndCreatedAtLessThanOrderByCreatedAtAsc(
                        idCampana,
                        rango.inicio(),
                        rango.fin()
                )
                .stream()
                .map(this::toRegistroResponse)
                .toList();
    }

    public CampanaGastoResumenDiarioResponse obtenerResumenDiarioCampana(Long idCampana, LocalDate fecha) {
        Campana campana = obtenerCampanaActiva(idCampana);
        LocalDate fechaTrabajo = resolverFecha(fecha);
        RangoFechas rango = rangoDia(fechaTrabajo);
        CampanaGastoRegistro ultimo = ultimoRegistro(registroRepository
                .findByCampanaIdAndCreatedAtGreaterThanEqualAndCreatedAtLessThanOrderByCreatedAtAsc(
                        idCampana,
                        rango.inicio(),
                        rango.fin()
                ));
        CampanaGastoCampanaResumenResponse resumen = toCampanaResumen(campana, ultimo);
        return CampanaGastoResumenDiarioResponse.builder()
                .idCampana(campana.getId())
                .nombreCampana(campana.getNombre())
                .fecha(fechaTrabajo)
                .leads(resumen.getLeads())
                .leadsReales(resumen.getLeadsReales())
                .ventasCerradas(resumen.getVentasCerradas())
                .costoTotal(resumen.getCostoTotal())
                .ultimoRegistroAt(resumen.getUltimoRegistroAt())
                .build();
    }

    public CampanaGastoResumenDiarioResponse obtenerResumenDiarioGlobal(LocalDate fecha) {
        LocalDate fechaTrabajo = resolverFecha(fecha);
        RangoFechas rango = rangoDia(fechaTrabajo);
        List<CampanaGastoCampanaResumenResponse> campanas = ultimosPorCampana(registroRepository
                .findByCreatedAtGreaterThanEqualAndCreatedAtLessThanOrderByCreatedAtAsc(rango.inicio(), rango.fin()))
                .values()
                .stream()
                .map(this::toCampanaResumen)
                .toList();
        return CampanaGastoResumenDiarioResponse.builder()
                .fecha(fechaTrabajo)
                .leads(totalLeads(campanas))
                .leadsReales(totalLeadsReales(campanas))
                .ventasCerradas(totalVentasCerradas(campanas))
                .costoTotal(totalCosto(campanas))
                .ultimoRegistroAt(ultimoRegistroAt(campanas))
                .campanas(campanas)
                .build();
    }

    public CampanaGastoResumenMensualResponse obtenerResumenMensualCampana(Long idCampana, Integer anio, Integer mes) {
        Campana campana = obtenerCampanaActiva(idCampana);
        YearMonth periodo = resolverPeriodo(anio, mes);
        RangoFechas rango = rangoMes(periodo);
        List<CampanaGastoRegistro> registros = registroRepository
                .findByCampanaIdAndCreatedAtGreaterThanEqualAndCreatedAtLessThanOrderByCreatedAtAsc(
                        idCampana,
                        rango.inicio(),
                        rango.fin()
                );
        CampanaGastoCampanaResumenResponse resumen = resumenMensualCampana(campana, registros);
        return CampanaGastoResumenMensualResponse.builder()
                .idCampana(campana.getId())
                .nombreCampana(campana.getNombre())
                .anio(periodo.getYear())
                .mes(periodo.getMonthValue())
                .leads(resumen.getLeads())
                .leadsReales(resumen.getLeadsReales())
                .ventasCerradas(resumen.getVentasCerradas())
                .costoTotal(resumen.getCostoTotal())
                .ultimoRegistroAt(resumen.getUltimoRegistroAt())
                .build();
    }

    public CampanaGastoResumenMensualResponse obtenerResumenMensualGlobal(Integer anio, Integer mes) {
        YearMonth periodo = resolverPeriodo(anio, mes);
        RangoFechas rango = rangoMes(periodo);
        List<CampanaGastoCampanaResumenResponse> campanas = registrosPorCampana(registroRepository
                .findByCreatedAtGreaterThanEqualAndCreatedAtLessThanOrderByCreatedAtAsc(rango.inicio(), rango.fin()))
                .values()
                .stream()
                .map(registros -> resumenMensualCampana(registros.get(0).getCampana(), registros))
                .toList();
        return CampanaGastoResumenMensualResponse.builder()
                .anio(periodo.getYear())
                .mes(periodo.getMonthValue())
                .leads(totalLeads(campanas))
                .leadsReales(totalLeadsReales(campanas))
                .ventasCerradas(totalVentasCerradas(campanas))
                .costoTotal(totalCosto(campanas))
                .ultimoRegistroAt(ultimoRegistroAt(campanas))
                .campanas(campanas)
                .build();
    }

    private void aplicarMetricasReales(CampanaGastoRegistro registro) {
        Instant createdAt = registro.getCreatedAt();
        Instant inicioDia = createdAt.atZone(ZONA_OPERATIVA).toLocalDate().atStartOfDay(ZONA_OPERATIVA).toInstant();
        Long idCampana = registro.getCampana().getId();
        registro.setLeadsReales((int) leadRepository.contarLeadsRealesPorCampanaYRango(idCampana, inicioDia, createdAt));
        registro.setVentasCerradas((int) eventoRepository.contarVentasCerradasPorCampanaYRango(
                idCampana,
                Accion.TIPIFICACION,
                TIPIFICACION_PREVENTA_COMPLETA,
                SUBTIPIFICACION_VENTA_CERRADA,
                inicioDia,
                createdAt
        ));
    }

    private Campana obtenerCampanaActiva(Long idCampana) {
        return campanaRepository.findByIdAndActivoTrue(idCampana)
                .orElseThrow(() -> new NotFoundException(Campana.class, idCampana));
    }

    private CampanaGastoResponse toRegistroResponse(CampanaGastoRegistro registro) {
        Campana campana = registro.getCampana();
        return CampanaGastoResponse.builder()
                .id(registro.getId())
                .idCampana(campana == null ? null : campana.getId())
                .nombreCampana(campana == null ? null : campana.getNombre())
                .leads(registro.getLeads())
                .leadsReales(registro.getLeadsReales())
                .ventasCerradas(registro.getVentasCerradas())
                .costoTotal(registro.getCostoTotal())
                .createdAt(registro.getCreatedAt())
                .updatedAt(registro.getUpdatedAt())
                .build();
    }

    private CampanaGastoCampanaResumenResponse toCampanaResumen(CampanaGastoRegistro registro) {
        return toCampanaResumen(registro.getCampana(), registro);
    }

    private CampanaGastoCampanaResumenResponse toCampanaResumen(Campana campana, CampanaGastoRegistro registro) {
        return CampanaGastoCampanaResumenResponse.builder()
                .idCampana(campana.getId())
                .nombreCampana(campana.getNombre())
                .leads(registro == null ? 0 : registro.getLeads())
                .leadsReales(registro == null ? 0 : registro.getLeadsReales())
                .ventasCerradas(registro == null ? 0 : registro.getVentasCerradas())
                .costoTotal(registro == null ? BigDecimal.ZERO : registro.getCostoTotal())
                .ultimoRegistroAt(registro == null ? null : registro.getCreatedAt())
                .build();
    }

    private CampanaGastoCampanaResumenResponse resumenMensualCampana(Campana campana, List<CampanaGastoRegistro> registros) {
        List<CampanaGastoRegistro> cierresDiarios = ultimosPorDia(registros).values().stream().toList();
        return CampanaGastoCampanaResumenResponse.builder()
                .idCampana(campana.getId())
                .nombreCampana(campana.getNombre())
                .leads(cierresDiarios.stream()
                        .map(CampanaGastoRegistro::getLeads)
                        .filter(Objects::nonNull)
                        .reduce(0, Integer::sum))
                .leadsReales(cierresDiarios.stream()
                        .map(CampanaGastoRegistro::getLeadsReales)
                        .filter(Objects::nonNull)
                        .reduce(0, Integer::sum))
                .ventasCerradas(cierresDiarios.stream()
                        .map(CampanaGastoRegistro::getVentasCerradas)
                        .filter(Objects::nonNull)
                        .reduce(0, Integer::sum))
                .costoTotal(cierresDiarios.stream()
                        .map(CampanaGastoRegistro::getCostoTotal)
                        .filter(Objects::nonNull)
                        .reduce(BigDecimal.ZERO, BigDecimal::add))
                .ultimoRegistroAt(cierresDiarios.stream()
                        .map(CampanaGastoRegistro::getCreatedAt)
                        .filter(Objects::nonNull)
                        .max(Comparator.naturalOrder())
                        .orElse(null))
                .build();
    }

    private Map<Long, CampanaGastoRegistro> ultimosPorCampana(List<CampanaGastoRegistro> registros) {
        Map<Long, CampanaGastoRegistro> ultimos = new LinkedHashMap<>();
        registros.forEach(registro -> ultimos.put(registro.getCampana().getId(), registro));
        return ultimos;
    }

    private Map<Long, List<CampanaGastoRegistro>> registrosPorCampana(List<CampanaGastoRegistro> registros) {
        Map<Long, List<CampanaGastoRegistro>> registrosPorCampana = new LinkedHashMap<>();
        registros.forEach(registro -> registrosPorCampana
                .computeIfAbsent(registro.getCampana().getId(), id -> new java.util.ArrayList<>())
                .add(registro));
        return registrosPorCampana;
    }

    private Map<LocalDate, CampanaGastoRegistro> ultimosPorDia(List<CampanaGastoRegistro> registros) {
        Map<LocalDate, CampanaGastoRegistro> ultimos = new LinkedHashMap<>();
        registros.forEach(registro -> ultimos.put(registro.getCreatedAt().atZone(ZONA_OPERATIVA).toLocalDate(), registro));
        return ultimos;
    }

    private CampanaGastoRegistro ultimoRegistro(List<CampanaGastoRegistro> registros) {
        return registros.isEmpty() ? null : registros.get(registros.size() - 1);
    }

    private Integer totalLeads(List<CampanaGastoCampanaResumenResponse> campanas) {
        return campanas.stream()
                .map(CampanaGastoCampanaResumenResponse::getLeads)
                .filter(Objects::nonNull)
                .reduce(0, Integer::sum);
    }

    private BigDecimal totalCosto(List<CampanaGastoCampanaResumenResponse> campanas) {
        return campanas.stream()
                .map(CampanaGastoCampanaResumenResponse::getCostoTotal)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private Integer totalLeadsReales(List<CampanaGastoCampanaResumenResponse> campanas) {
        return campanas.stream()
                .map(CampanaGastoCampanaResumenResponse::getLeadsReales)
                .filter(Objects::nonNull)
                .reduce(0, Integer::sum);
    }

    private Integer totalVentasCerradas(List<CampanaGastoCampanaResumenResponse> campanas) {
        return campanas.stream()
                .map(CampanaGastoCampanaResumenResponse::getVentasCerradas)
                .filter(Objects::nonNull)
                .reduce(0, Integer::sum);
    }

    private Instant ultimoRegistroAt(List<CampanaGastoCampanaResumenResponse> campanas) {
        return campanas.stream()
                .map(CampanaGastoCampanaResumenResponse::getUltimoRegistroAt)
                .filter(Objects::nonNull)
                .max(Comparator.naturalOrder())
                .orElse(null);
    }

    private LocalDate resolverFecha(LocalDate fecha) {
        return fecha == null ? LocalDate.now(ZONA_OPERATIVA) : fecha;
    }

    private YearMonth resolverPeriodo(Integer anio, Integer mes) {
        if (anio == null && mes == null) {
            return YearMonth.now(ZONA_OPERATIVA);
        }
        if (anio == null || mes == null) {
            throw new BadRequestException("anio y mes deben enviarse juntos");
        }
        if (mes < 1 || mes > 12) {
            throw new BadRequestException("mes debe estar entre 1 y 12");
        }
        return YearMonth.of(anio, mes);
    }

    private RangoFechas rangoDia(LocalDate fecha) {
        return new RangoFechas(
                fecha.atStartOfDay(ZONA_OPERATIVA).toInstant(),
                fecha.plusDays(1).atStartOfDay(ZONA_OPERATIVA).toInstant()
        );
    }

    private RangoFechas rangoMes(YearMonth periodo) {
        return new RangoFechas(
                periodo.atDay(1).atStartOfDay(ZONA_OPERATIVA).toInstant(),
                periodo.plusMonths(1).atDay(1).atStartOfDay(ZONA_OPERATIVA).toInstant()
        );
    }

    private record RangoFechas(Instant inicio, Instant fin) {
    }
}
