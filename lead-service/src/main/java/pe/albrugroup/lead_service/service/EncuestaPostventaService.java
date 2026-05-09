package pe.albrugroup.lead_service.service;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.albrugroup.lead_service.configuration.CurrentUser;
import pe.albrugroup.lead_service.entity.EncuestaPostventa;
import pe.albrugroup.lead_service.entity.Lead;
import pe.albrugroup.lead_service.entity.enums.Etapa;
import pe.albrugroup.lead_service.entity.enums.StatusSatisfaccion;
import pe.albrugroup.lead_service.entity.request.EncuestaPostventaRequest;
import pe.albrugroup.lead_service.entity.request.PageRequest;
import pe.albrugroup.lead_service.entity.response.EncuestaPostventaResponse;
import pe.albrugroup.lead_service.entity.response.PageResponse;
import pe.albrugroup.lead_service.entity.response.SatisfaccionPostventaResponse;
import pe.albrugroup.lead_service.exception.NotFoundException;
import pe.albrugroup.lead_service.repository.EncuestaPostventaRepository;
import pe.albrugroup.lead_service.repository.LeadRepository;
import pe.albrugroup.lead_service.service.mapper.EncuestaPostventaMapper;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.Set;

@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class EncuestaPostventaService {

    private final EncuestaPostventaRepository encuestaRepository;
    private final LeadRepository leadRepository;
    private final CurrentUser currentUser;
    private final EncuestaPostventaMapper mapper;
    private final PaginationService paginationService;

    private static final Set<Etapa> ETAPAS_GESTION_POSTVENTA = Set.of(Etapa.POSTVENTA, Etapa.COBRANZA);
    private static final Set<String> ENCUESTA_SORT_FIELDS = Set.of(
            "createdAt", "calificacionAsesor", "calificacionServicio"
    );

    @Transactional
    public EncuestaPostventaResponse registrarEncuesta(Long idLead, EncuestaPostventaRequest request) {
        Lead lead = obtenerLeadAsignadoGestionable(idLead);
        EncuestaPostventa encuesta = mapper.toEntity(request);
        encuesta.setLead(lead);
        return mapper.toResponse(encuestaRepository.save(encuesta));
    }

    public PageResponse<EncuestaPostventaResponse> listarEncuestasPorLead(Long idLead, PageRequest pageRequest) {
        obtenerLeadAsignadoGestionable(idLead);
        Page<EncuestaPostventaResponse> encuestas = encuestaRepository.findByLeadIdOrderByCreatedAtDesc(
                idLead,
                paginationService.toPageable(pageRequest, ENCUESTA_SORT_FIELDS)
        ).map(mapper::toResponse);
        return PageResponse.from(encuestas);
    }

    public SatisfaccionPostventaResponse obtenerResumenEncuestasPorLead(Long idLead) {
        obtenerLeadAsignadoGestionable(idLead);
        List<EncuestaPostventa> encuestas = encuestaRepository.findByLeadId(idLead);
        if (encuestas.isEmpty()) {
            return new SatisfaccionPostventaResponse(idLead, null, null, null, null);
        }

        BigDecimal satisfaccionAsesor = promedio(encuestas.stream()
                .map(EncuestaPostventa::getCalificacionAsesor)
                .toList());
        BigDecimal satisfaccionServicio = promedio(encuestas.stream()
                .map(EncuestaPostventa::getCalificacionServicio)
                .toList());
        BigDecimal promedioSatisfaccion = satisfaccionAsesor
                .add(satisfaccionServicio)
                .divide(BigDecimal.valueOf(2), 2, RoundingMode.HALF_UP);

        return new SatisfaccionPostventaResponse(
                idLead,
                satisfaccionAsesor,
                satisfaccionServicio,
                promedioSatisfaccion,
                resolverStatusSatisfaccion(promedioSatisfaccion)
        );
    }

    private BigDecimal promedio(List<Integer> valores) {
        BigDecimal total = valores.stream()
                .map(BigDecimal::valueOf)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        return total.divide(BigDecimal.valueOf(valores.size()), 2, RoundingMode.HALF_UP);
    }

    private StatusSatisfaccion resolverStatusSatisfaccion(BigDecimal promedio) {
        if (promedio.compareTo(BigDecimal.valueOf(2)) < 0) {
            return StatusSatisfaccion.NADA_SATISFECHO;
        }
        if (promedio.compareTo(BigDecimal.valueOf(3)) < 0) {
            return StatusSatisfaccion.POCO_SATISFECHO;
        }
        if (promedio.compareTo(BigDecimal.valueOf(4)) < 0) {
            return StatusSatisfaccion.SATISFECHO;
        }
        return StatusSatisfaccion.MUY_SATISFECHO;
    }

    private Lead obtenerLeadAsignadoGestionable(Long idLead) {
        return leadRepository.findByIdAndIdAsesorAsignadoAndEtapaIn(
                        idLead,
                        currentUser.empleadoID(),
                        ETAPAS_GESTION_POSTVENTA
                )
                .orElseThrow(() -> new NotFoundException(Lead.class, idLead));
    }
}
