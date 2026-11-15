package pe.albrugroup.lead_service.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import pe.albrugroup.lead_service.configuration.OperationalDateTime;
import pe.albrugroup.lead_service.entity.enums.Etapa;
import pe.albrugroup.lead_service.entity.response.MetricasEmpleadoResponse;
import pe.albrugroup.lead_service.entity.response.MetricasEmpleadoResponse.DetalleLead;
import pe.albrugroup.lead_service.entity.response.MetricasEmpleadoResponse.MetricaDia;
import pe.albrugroup.lead_service.repository.LeadEtapaResumenRepository;

import java.time.Instant;
import java.time.LocalDate;
import java.time.YearMonth;
import java.math.BigDecimal;
import java.util.ArrayList;
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

        Map<LocalDate, AcumuladoDia> porDia = new LinkedHashMap<>();
        for (int dia = 1; dia <= periodo.lengthOfMonth(); dia++) {
            porDia.put(periodo.atDay(dia), new AcumuladoDia());
        }

        for (Object[] row : rows) {
            Instant fechaMerito = (Instant) row[0];
            Etapa etapaActual = (Etapa) row[1];

            LocalDate dia = OperationalDateTime.toOperationalDate(fechaMerito);
            AcumuladoDia acumulado = porDia.computeIfAbsent(dia, k -> new AcumuladoDia());
            boolean instalada = ETAPAS_INSTALADA.contains(etapaActual);
            acumulado.preventas++;
            if (instalada) {
                acumulado.instaladas++;
            }
            acumulado.leads.add(new DetalleLead(
                    (Long) row[2],
                    (String) row[3],
                    (String) row[4],
                    (String) row[5],
                    (String) row[6],
                    (BigDecimal) row[7],
                    (String) row[8],
                    (LocalDate) row[9],
                    etapaActual,
                    instalada
            ));
        }

        List<MetricaDia> dias = porDia.entrySet().stream()
                .sorted(Comparator.comparing(Map.Entry::getKey))
                .map(e -> new MetricaDia(
                        e.getKey(),
                        e.getValue().preventas,
                        e.getValue().instaladas,
                        List.copyOf(e.getValue().leads)
                ))
                .toList();

        return new MetricasEmpleadoResponse(dias);
    }

    private static final class AcumuladoDia {
        private long preventas;
        private long instaladas;
        private final List<DetalleLead> leads = new ArrayList<>();
    }
}
