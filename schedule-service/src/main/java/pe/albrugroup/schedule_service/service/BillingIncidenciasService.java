package pe.albrugroup.schedule_service.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.albrugroup.schedule_service.entity.Asistencia;
import pe.albrugroup.schedule_service.entity.response.asistencia.BillingEmpleadoIncidenciasResponse;
import pe.albrugroup.schedule_service.entity.response.asistencia.BillingIncidenciaDiaResponse;
import pe.albrugroup.schedule_service.repository.AsistenciaRepository;

import java.time.Duration;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BillingIncidenciasService {

    private final AsistenciaRepository asistenciaRepository;
    private final ParametroAsistenciaResolver parametroResolver;

    @Transactional(readOnly = true)
    public List<BillingEmpleadoIncidenciasResponse> obtenerIncidencias(Integer anio, Integer mes, List<Long> empleados) {
        YearMonth periodo = YearMonth.of(anio, mes);
        List<Asistencia> asistencias = asistenciaRepository.findByIdEmpleadoInAndFechaBetweenOrderByIdEmpleadoAscFechaAsc(
                empleados,
                periodo.atDay(1),
                periodo.atEndOfMonth()
        );
        int tolerancia = parametroResolver.resolve(List.of()).toleranciaTardanzaMin();
        Map<Long, List<BillingIncidenciaDiaResponse>> porEmpleado = asistencias.stream()
                .collect(Collectors.groupingBy(
                        Asistencia::getIdEmpleado,
                        Collectors.mapping(asistencia -> toIncidencia(asistencia, tolerancia), Collectors.toList())
                ));
        return empleados.stream()
                .map(idEmpleado -> new BillingEmpleadoIncidenciasResponse(idEmpleado, porEmpleado.getOrDefault(idEmpleado, List.of())))
                .toList();
    }

    private BillingIncidenciaDiaResponse toIncidencia(Asistencia asistencia, int tolerancia) {
        boolean falta = asistencia.getMinutosObjetivoDia() != null
                && asistencia.getMinutosObjetivoDia() > 0
                && asistencia.getFechaHoraIngreso() == null;
        int minutosTarde = calcularMinutosTarde(asistencia, tolerancia);
        return new BillingIncidenciaDiaResponse(
                asistencia.getFecha(),
                falta,
                minutosTarde > 0,
                minutosTarde,
                nvl(asistencia.getMinutosExtra()),
                nvl(asistencia.getMinutosTrabajados())
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
