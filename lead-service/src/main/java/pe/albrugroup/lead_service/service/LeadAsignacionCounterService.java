package pe.albrugroup.lead_service.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.albrugroup.lead_service.entity.enums.Accion;
import pe.albrugroup.lead_service.repository.EventoRepository;

import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.time.Instant;

@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class LeadAsignacionCounterService {

    private final EventoRepository eventoRepository;

    public Map<Long, Long> contarAsignacionesPorLeadIds(Collection<Long> leadIds) {
        List<Long> ids = normalizarIds(leadIds);
        if (ids.isEmpty()) {
            return Map.of();
        }

        Map<Long, Long> conteos = new HashMap<>();
        for (Object[] row : eventoRepository.contarPorLeadIdsYAccion(ids, Accion.ASIGNACION)) {
            conteos.put((Long) row[0], (Long) row[1]);
        }
        return conteos;
    }

    public Map<Long, Long> contarAsignacionesPorLeadIds(Collection<Long> leadIds, Instant fechaDesde, Instant fechaHasta) {
        List<Long> ids = normalizarIds(leadIds);
        if (ids.isEmpty() || fechaDesde == null || fechaHasta == null) {
            return Map.of();
        }

        Map<Long, Long> conteos = new HashMap<>();
        for (Object[] row : eventoRepository.contarPorLeadIdsYAccionYFechas(ids, Accion.ASIGNACION, fechaDesde, fechaHasta)) {
            conteos.put((Long) row[0], (Long) row[1]);
        }
        return conteos;
    }

    private List<Long> normalizarIds(Collection<Long> leadIds) {
        if (leadIds == null || leadIds.isEmpty()) {
            return List.of();
        }

        return leadIds.stream()
                .filter(id -> id != null && id > 0)
                .distinct()
                .toList();
    }
}
