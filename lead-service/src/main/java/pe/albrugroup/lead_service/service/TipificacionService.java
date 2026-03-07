package pe.albrugroup.lead_service.service;

import lombok.RequiredArgsConstructor;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.stereotype.Service;
import pe.albrugroup.lead_service.entity.Subtipificacion;
import pe.albrugroup.lead_service.entity.Tipificacion;
import pe.albrugroup.lead_service.entity.enums.Etapa;
import pe.albrugroup.lead_service.entity.request.CatalogoRequest;
import pe.albrugroup.lead_service.entity.request.SubtipificacionCatalogoRequest;
import pe.albrugroup.lead_service.entity.request.TipificacionCatalogoRequest;
import pe.albrugroup.lead_service.entity.response.CatalogoResponse;
import pe.albrugroup.lead_service.entity.response.SubtipificacionResponse;
import pe.albrugroup.lead_service.entity.response.TipificacionResponse;
import pe.albrugroup.lead_service.exception.SubtipificacionNoPerteneceATipificacionException;
import pe.albrugroup.lead_service.exception.SubtipificacionNotFoundException;
import pe.albrugroup.lead_service.exception.TipificacionNotFoundException;
import pe.albrugroup.lead_service.repository.SubtipificacionRepository;
import pe.albrugroup.lead_service.repository.TipificacionRepository;
import pe.albrugroup.lead_service.service.mapper.TipificacionMapper;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

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

    @Transactional
    public CatalogoResponse upsertCatalogo(CatalogoRequest request) {
        List<TipificacionCatalogoRequest> tipificacionesRequest = Objects.requireNonNullElse(
                request.getTipificaciones(),
                List.of()
        );

        for (TipificacionCatalogoRequest tipificacionRequest : tipificacionesRequest) {
            Tipificacion tipificacion = upsertTipificacion(request.getEtapa(), tipificacionRequest);
            List<SubtipificacionCatalogoRequest> subtipificacionesRequest = Objects.requireNonNullElse(
                    tipificacionRequest.getSubtipificaciones(),
                    List.of()
            );
            for (SubtipificacionCatalogoRequest subtipificacionRequest : subtipificacionesRequest) {
                upsertSubtipificacion(tipificacion, subtipificacionRequest);
            }
        }

        return getCatalogoPorEtapa(request.getEtapa());
    }

    private Tipificacion upsertTipificacion(Etapa etapa, TipificacionCatalogoRequest request) {
        if (request.getId() == null) {
            Tipificacion tipificacion = mapper.toEntity(request);
            tipificacion.setEtapa(etapa);
            tipificacion.setActivo(Boolean.TRUE);
            return tipificacionRepository.save(tipificacion);
        }

        Tipificacion tipificacion = tipificacionRepository.findById(request.getId())
                .orElseThrow(() -> new TipificacionNotFoundException(request.getId()));

        mapper.updateDatosTipificacion(request, tipificacion);
        tipificacion.setEtapa(etapa);
        tipificacion.setActivo(Boolean.TRUE);
        return tipificacionRepository.save(tipificacion);
    }

    private void upsertSubtipificacion(Tipificacion tipificacion, SubtipificacionCatalogoRequest request) {
        if (request.getId() == null) {
            Subtipificacion subtipificacion = mapper.toEntity(request);
            subtipificacion.setTipificacion(tipificacion);
            subtipificacion.setActivo(Boolean.TRUE);
            subtipificacionRepository.save(subtipificacion);
            return;
        }

        Subtipificacion subtipificacion = subtipificacionRepository.findById(request.getId())
                .orElseThrow(() -> new SubtipificacionNotFoundException(request.getId()));

        if (!subtipificacion.getTipificacion().getId().equals(tipificacion.getId())) {
            throw new SubtipificacionNoPerteneceATipificacionException(
                    request.getId(),
                    tipificacion.getId()
            );
        }

        mapper.updateDatosSubtipificacion(request, subtipificacion);
        subtipificacion.setActivo(Boolean.TRUE);
        subtipificacionRepository.save(subtipificacion);
    }
}
