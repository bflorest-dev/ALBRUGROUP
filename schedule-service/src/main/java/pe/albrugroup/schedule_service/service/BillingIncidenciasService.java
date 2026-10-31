package pe.albrugroup.schedule_service.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.albrugroup.schedule_service.entity.Asistencia;
import pe.albrugroup.schedule_service.entity.DiaNoLaborable;
import pe.albrugroup.schedule_service.entity.ExcepcionHorario;
import pe.albrugroup.schedule_service.entity.enums.AlcanceDiaNoLaborable;
import pe.albrugroup.schedule_service.entity.enums.TipoExcepcionHorario;
import pe.albrugroup.schedule_service.entity.response.asistencia.BillingEmpleadoIncidenciasResponse;
import pe.albrugroup.schedule_service.entity.response.asistencia.BillingIncidenciaDiaResponse;
import pe.albrugroup.schedule_service.repository.AsistenciaRepository;
import pe.albrugroup.schedule_service.repository.DiaNoLaborableRepository;
import pe.albrugroup.schedule_service.repository.ExcepcionHorarioRepository;
import pe.albrugroup.schedule_service.repository.HorarioRepository;

import java.time.Duration;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BillingIncidenciasService {

    private final AsistenciaRepository asistenciaRepository;
    private final ParametroAsistenciaResolver parametroResolver;
    private final DiaNoLaborableRepository diaNoLaborableRepository;
    private final ExcepcionHorarioRepository excepcionHorarioRepository;
    private final HorarioRepository horarioRepository;

    @Transactional(readOnly = true)
    public List<BillingEmpleadoIncidenciasResponse> obtenerIncidencias(Integer anio, Integer mes, List<Long> empleados) {
        YearMonth periodo = YearMonth.of(anio, mes);
        LocalDate desde = periodo.atDay(1);
        LocalDate hasta = periodo.atEndOfMonth();

        List<Asistencia> asistencias = asistenciaRepository.findByIdEmpleadoInAndFechaBetweenOrderByIdEmpleadoAscFechaAsc(
                empleados, desde, hasta);
        int tolerancia = parametroResolver.resolve(List.of()).toleranciaTardanzaMin();

        Map<Long, List<BillingIncidenciaDiaResponse>> porEmpleado = asistencias.stream()
                .collect(Collectors.groupingBy(
                        Asistencia::getIdEmpleado,
                        Collectors.mapping(a -> toIncidencia(a, tolerancia), Collectors.toList())
                ));

        Map<Long, List<LocalDate>> diasLibresPorEmpleado = calcularDiasLibres(empleados, asistencias, desde, hasta);

        return empleados.stream()
                .map(idEmpleado -> new BillingEmpleadoIncidenciasResponse(
                        idEmpleado,
                        porEmpleado.getOrDefault(idEmpleado, List.of()),
                        diasLibresPorEmpleado.getOrDefault(idEmpleado, List.of())
                ))
                .toList();
    }

    private Map<Long, List<LocalDate>> calcularDiasLibres(
            List<Long> empleados,
            List<Asistencia> asistencias,
            LocalDate desde,
            LocalDate hasta
    ) {
        // DiaNoLaborable del período (una sola query)
        List<DiaNoLaborable> diasNoLab = diaNoLaborableRepository.findByFechaBetween(desde, hasta);
        Map<LocalDate, List<DiaNoLaborable>> diasNoLabPorFecha = diasNoLab.stream()
                .collect(Collectors.groupingBy(DiaNoLaborable::getFecha));

        // Horarios por empleado: desde asistencias + consulta para los que no tienen registro
        Map<Long, Set<Long>> horariosPorEmpleado = asistencias.stream()
                .collect(Collectors.groupingBy(
                        Asistencia::getIdEmpleado,
                        Collectors.mapping(Asistencia::getIdHorario, Collectors.toSet())
                ));
        for (Long idEmpleado : empleados) {
            if (!horariosPorEmpleado.containsKey(idEmpleado)) {
                horarioRepository.findHorarioVigente(idEmpleado, desde)
                        .ifPresent(h -> horariosPorEmpleado.computeIfAbsent(idEmpleado, k -> new HashSet<>()).add(h.getId()));
            }
        }

        // ExcepcionHorario DIA_LIBRE para todos los horarios (una sola query)
        List<Long> todosHorarioIds = horariosPorEmpleado.values().stream()
                .flatMap(Set::stream).distinct().toList();
        Map<Long, Set<LocalDate>> diaLibrePorHorario = todosHorarioIds.isEmpty()
                ? Map.of()
                : excepcionHorarioRepository.findByHorarioIdInAndFechaBetween(todosHorarioIds, desde, hasta).stream()
                        .filter(e -> e.getTipo() == TipoExcepcionHorario.DIA_LIBRE)
                        .collect(Collectors.groupingBy(
                                e -> e.getHorario().getId(),
                                Collectors.mapping(ExcepcionHorario::getFecha, Collectors.toSet())
                        ));

        // Resolver días libres por empleado
        Map<Long, List<LocalDate>> result = new HashMap<>();
        for (Long idEmpleado : empleados) {
            // TreeSet mantiene orden y elimina duplicados
            Set<LocalDate> libres = new TreeSet<>();

            // DiaNoLaborable: EMPLEADO > GLOBAL (misma precedencia que JornadaEfectivaResolver)
            for (Map.Entry<LocalDate, List<DiaNoLaborable>> entry : diasNoLabPorFecha.entrySet()) {
                DiaNoLaborable override = resolverDiaNoLaborable(entry.getValue(), idEmpleado);
                if (override != null && Boolean.FALSE.equals(override.getLaborable())) {
                    libres.add(entry.getKey());
                }
            }

            // ExcepcionHorario DIA_LIBRE
            for (Long hId : horariosPorEmpleado.getOrDefault(idEmpleado, Set.of())) {
                libres.addAll(diaLibrePorHorario.getOrDefault(hId, Set.of()));
            }

            result.put(idEmpleado, new ArrayList<>(libres));
        }
        return result;
    }

    private DiaNoLaborable resolverDiaNoLaborable(List<DiaNoLaborable> dias, Long idEmpleado) {
        return dias.stream()
                .filter(d -> d.getAlcance() == AlcanceDiaNoLaborable.EMPLEADO && idEmpleado.equals(d.getRefId()))
                .findFirst()
                .orElseGet(() -> dias.stream()
                        .filter(d -> d.getAlcance() == AlcanceDiaNoLaborable.GLOBAL)
                        .findFirst()
                        .orElse(null));
    }

    private BillingIncidenciaDiaResponse toIncidencia(Asistencia asistencia, int tolerancia) {
        boolean falta = asistencia.getMinutosObjetivoDia() != null
                && asistencia.getMinutosObjetivoDia() > 0
                && asistencia.getFechaHoraIngreso() == null;
        int minutosTarde = calcularMinutosTarde(asistencia, tolerancia);
        int minutosJornada = nvl(asistencia.getMinutosTrabajados())
                + nvl(asistencia.getMinutosAlmuerzoTomados())
                + nvl(asistencia.getMinutosServiciosAcumulados());
        return new BillingIncidenciaDiaResponse(
                asistencia.getFecha(),
                falta,
                minutosTarde > 0,
                minutosTarde,
                nvl(asistencia.getMinutosExtra()),
                nvl(asistencia.getMinutosTrabajados()),
                minutosJornada
        );
    }

    private int calcularMinutosTarde(Asistencia asistencia, int tolerancia) {
        if (asistencia.getEntradaProgramada() == null || asistencia.getFechaHoraIngreso() == null) {
            return 0;
        }
        LocalDate fecha = asistencia.getFecha();
        long minutos = Duration.between(
                fecha.atTime(asistencia.getEntradaProgramada()),
                asistencia.getFechaHoraIngreso()
        ).toMinutes();
        return minutos > tolerancia ? (int) minutos : 0;
    }

    private int nvl(Integer value) {
        return value == null ? 0 : value;
    }
}
