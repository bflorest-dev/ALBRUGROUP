package pe.albrugroup.lead_service.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import pe.albrugroup.lead_service.configuration.OperationalDateTime;
import pe.albrugroup.lead_service.entity.enums.Etapa;
import pe.albrugroup.lead_service.entity.response.MetricasEmpleadoResponse;
import pe.albrugroup.lead_service.entity.response.MetricasEmpleadoResponse.MetricaDia;
import pe.albrugroup.lead_service.repository.LeadEtapaResumenRepository;

import java.time.Instant;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class MetricasEmpleadoService {

    private static final Set<Etapa> ETAPAS_INSTALADA = Set.of(Etapa.POSTVENTA, Etapa.COBRANZA);

    private final LeadEtapaResumenRepository resumenRepository;

    public MetricasEmpleadoResponse obtener(Long idEmpleado, YearMonth periodo) {
        var range = OperationalDateTime.monthRange(periodo);

        List<Object[]> rows = resumenRepository.metricasEmpleadoPorMerito(
                idEmpleado, Etapa.PREVENTA, range.inicio(), range.fin()
        );

        Map<LocalDate, long[]> porDia = new LinkedHashMap<>();

        for (Object[] row : rows) {
            Instant fechaMerito = (Instant) row[0];
            Etapa etapaActual = (Etapa) row[1];

            LocalDate dia = OperationalDateTime.toOperationalDate(fechaMerito);
            long[] contadores = porDia.computeIfAbsent(dia, k -> new long[2]);
            contadores[0]++;
            if (ETAPAS_INSTALADA.contains(etapaActual)) {
                contadores[1]++;
            }
        }

        List<MetricaDia> dias = porDia.entrySet().stream()
                .sorted(Comparator.comparing(Map.Entry::getKey))
                .map(e -> new MetricaDia(e.getKey(), e.getValue()[0], e.getValue()[1]))
                .toList();

        return new MetricasEmpleadoResponse(dias);
    }
}
