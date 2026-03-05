package pe.albrugroup.lead_service.service;

import lombok.RequiredArgsConstructor;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.stereotype.Service;
import pe.albrugroup.lead_service.entity.Subtipificacion;
import pe.albrugroup.lead_service.entity.Tipificacion;
import pe.albrugroup.lead_service.entity.enums.Etapa;
import pe.albrugroup.lead_service.entity.response.CatalogoResponse;
import pe.albrugroup.lead_service.entity.response.SubtipificacionResponse;
import pe.albrugroup.lead_service.entity.response.TipificacionResponse;
import pe.albrugroup.lead_service.repository.SubtipificacionRepository;
import pe.albrugroup.lead_service.repository.TipificacionRepository;
import pe.albrugroup.lead_service.service.mapper.TipificacionMapper;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class TipificacionService {

    private final TipificacionRepository tipificacionRepository;
    private final SubtipificacionRepository subtipificacionRepository;
    private final TipificacionMapper mapper;

    public CatalogoResponse getCatalogoPorEtapa(Etapa etapa) {
        List<Tipificacion> tipificaciones = tipificacionRepository.findByEtapaAndActivoTrueOrderByOrdenAsc(etapa);
        if (tipificaciones.isEmpty()) {
            return new CatalogoResponse(etapa, List.of());
        }

        List<Subtipificacion> subtipificaciones = subtipificacionRepository
                .findByTipificacionInAndActivoTrueOrderByTipificacion_IdAscOrdenAsc(tipificaciones);

        Map<Long, List<SubtipificacionResponse>> subtipificacionesPorTipificacionId = new HashMap<>();
        for (Subtipificacion subtipificacion : subtipificaciones) {
            Long tipificacionId = subtipificacion.getTipificacion().getId();
            subtipificacionesPorTipificacionId
                    .computeIfAbsent(tipificacionId, key -> new java.util.ArrayList<>())
                    .add(mapper.toResponse(subtipificacion));
        }

        List<TipificacionResponse> tipificacionesResponse = tipificaciones.stream()
                .map(tipificacion -> mapper.toResponse(
                        tipificacion,
                        subtipificacionesPorTipificacionId.getOrDefault(tipificacion.getId(), List.of())
                ))
                .toList();

        return new CatalogoResponse(etapa, tipificacionesResponse);
    }
}
