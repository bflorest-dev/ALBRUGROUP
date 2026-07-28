package pe.albrugroup.lead_service.service;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.albrugroup.lead_service.configuration.CurrentUser;
import pe.albrugroup.lead_service.entity.EncuestaPostventa;
import pe.albrugroup.lead_service.entity.Lead;
import pe.albrugroup.lead_service.entity.PeriodoFacturacionPostventa;
import pe.albrugroup.lead_service.entity.enums.EstadoEncuestaPostventa;
import pe.albrugroup.lead_service.entity.enums.PrioridadEncuestaPostventa;
import pe.albrugroup.lead_service.entity.enums.StatusEncuestaPostventa;
import pe.albrugroup.lead_service.entity.enums.Etapa;
import pe.albrugroup.lead_service.entity.enums.StatusSatisfaccion;
import pe.albrugroup.lead_service.entity.enums.TipoEncuestaPostventa;
import pe.albrugroup.lead_service.entity.request.EncuestaPostventaRequest;
import pe.albrugroup.lead_service.entity.request.PageRequest;
import pe.albrugroup.lead_service.entity.response.EncuestaPostventaResponse;
import pe.albrugroup.lead_service.entity.response.PageResponse;
import pe.albrugroup.lead_service.entity.response.SatisfaccionPostventaResponse;
import pe.albrugroup.lead_service.exception.BadRequestException;
import pe.albrugroup.lead_service.exception.NotFoundException;
import pe.albrugroup.lead_service.repository.EncuestaPostventaRepository;
import pe.albrugroup.lead_service.repository.LeadRepository;
import pe.albrugroup.lead_service.repository.PeriodoFacturacionPostventaRepository;
import pe.albrugroup.lead_service.service.mapper.EncuestaPostventaMapper;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class EncuestaPostventaService {

    private final EncuestaPostventaRepository encuestaRepository;
    private final LeadRepository leadRepository;
    private final PeriodoFacturacionPostventaRepository periodoRepository;
    private final CurrentUser currentUser;
    private final EncuestaPostventaMapper mapper;
    private final PaginationService paginationService;

    private static final Set<Etapa> ETAPAS_GESTION_POSTVENTA = Set.of(Etapa.POSTVENTA);
    private static final Set<String> ENCUESTA_SORT_FIELDS = Set.of(
            "createdAt", "calificacion"
    );

    @Transactional
    public EncuestaPostventaResponse registrarEncuesta(Long idLead, EncuestaPostventaRequest request) {
        Lead lead = obtenerLeadAsignadoGestionable(idLead);
        Integer calificacion = resolverCalificacion(request);
        TipoEncuestaPostventa tipoEncuesta = resolverTipoEncuesta(request);

        EncuestaPostventa encuesta = obtenerEncuestaObjetivo(lead, tipoEncuesta, request);
        encuesta.setTipoContacto(request.getTipoContacto());
        encuesta.setCalificacion(calificacion);
        encuesta.setStatus(resolverStatusEncuesta(calificacion));
        encuesta.setEstado(EstadoEncuestaPostventa.REALIZADA);
        encuesta.setPrioridad(PrioridadEncuestaPostventa.NORMAL);
        encuesta.setFechaRealizada(LocalDateTime.now());
        encuesta.setComentario(request.getComentario());
        encuesta.setIdAsesorEncuesta(currentUser.empleadoID());
        encuesta.setNombreAsesorEncuesta(currentUser.nombreCompleto());
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
        List<Integer> calificaciones = encuestaRepository.findByLeadId(idLead).stream()
                .filter(encuesta -> encuesta.getEstado() == EstadoEncuestaPostventa.REALIZADA)
                .map(EncuestaPostventa::getCalificacion)
                .filter(calificacion -> calificacion != null)
                .toList();
        if (calificaciones.isEmpty()) {
            return new SatisfaccionPostventaResponse(idLead, null, null);
        }

        BigDecimal promedioSatisfaccion = promedio(calificaciones);

        return new SatisfaccionPostventaResponse(
                idLead,
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

    private PeriodoFacturacionPostventa obtenerPeriodoSiCorresponde(Long idLead, Long idPeriodoFacturacion) {
        if (idPeriodoFacturacion == null) {
            return null;
        }
        PeriodoFacturacionPostventa periodo = periodoRepository.findById(idPeriodoFacturacion)
                .orElseThrow(() -> new NotFoundException(PeriodoFacturacionPostventa.class, idPeriodoFacturacion));
        if (periodo.getLead() == null || !periodo.getLead().getId().equals(idLead)) {
            throw new BadRequestException("El periodo de facturacion no pertenece al lead indicado");
        }
        return periodo;
    }

    private TipoEncuestaPostventa resolverTipoEncuesta(EncuestaPostventaRequest request) {
        if (request.getTipoEncuesta() != null) {
            return request.getTipoEncuesta();
        }
        return request.getIdPeriodoFacturacion() == null
                ? TipoEncuestaPostventa.SATISFACCION_ASESOR
                : TipoEncuestaPostventa.SATISFACCION_SERVICIO;
    }

    private EncuestaPostventa obtenerEncuestaObjetivo(
            Lead lead,
            TipoEncuestaPostventa tipoEncuesta,
            EncuestaPostventaRequest request
    ) {
        if (tipoEncuesta == TipoEncuestaPostventa.SATISFACCION_ASESOR) {
            return encuestaRepository
                    .findFirstByLeadIdAndTipoEncuestaAndEstadoOrderByFechaProgramadaAscCreatedAtAscIdAsc(
                            lead.getId(),
                            TipoEncuestaPostventa.SATISFACCION_ASESOR,
                            EstadoEncuestaPostventa.PENDIENTE
                    )
                    .orElseThrow(() -> new BadRequestException("No existe una encuesta pendiente de satisfaccion del asesor para completar"));
        }

        EncuestaPostventa encuesta = mapper.toEntity(request);
        encuesta.setLead(lead);
        encuesta.setPeriodoFacturacionPostventa(obtenerPeriodoSiCorresponde(lead.getId(), request.getIdPeriodoFacturacion()));
        encuesta.setTipoEncuesta(tipoEncuesta);
        return encuesta;
    }

    private Integer resolverCalificacion(EncuestaPostventaRequest request) {
        Integer calificacion = request.getCalificacion();
        if (calificacion == null) {
            throw new BadRequestException("calificacion es obligatoria");
        }
        return calificacion;
    }

    private StatusEncuestaPostventa resolverStatusEncuesta(Integer calificacion) {
        if (calificacion <= 4) {
            return StatusEncuestaPostventa.MALO;
        }
        if (calificacion <= 6) {
            return StatusEncuestaPostventa.REGULAR;
        }
        if (calificacion <= 8) {
            return StatusEncuestaPostventa.BUENO;
        }
        return StatusEncuestaPostventa.EXCELENTE;
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
