package pe.albrugroup.lead_service.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.albrugroup.lead_service.configuration.OperationalDateTime;
import pe.albrugroup.lead_service.entity.enums.Etapa;
import pe.albrugroup.lead_service.entity.request.PageRequest;
import pe.albrugroup.lead_service.entity.response.LeadGtrResponse;
import pe.albrugroup.lead_service.entity.response.PageResponse;
import pe.albrugroup.lead_service.exception.BadRequestException;
import pe.albrugroup.lead_service.repository.LeadRepository;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class MasivoService {

    private static final List<Long> FILTRO_VACIO = List.of(-1L);
    private static final List<String> TIPIFICACIONES_EXCLUIDAS_MASIVO = List.of(
            "PREVENTA_COMPLETA"
    );

    private final LeadRepository leadRepository;
    private final PaginationService paginationService;
    private final LeadAsignacionCounterService leadAsignacionCounterService;

    private static final Set<String> MASIVO_SORT_FIELDS = Set.of(
            "lastEntryAt", "createdAt", "id", "lead", "nombreAsesorAsignado", "estado"
    );

    public PageResponse<LeadGtrResponse> listarLeads(
            Long idProveedor,
            Etapa etapa,
            List<Long> tipificaciones,
            List<Long> subtipificaciones,
            LocalDate fechaDesde,
            LocalDate fechaHasta,
            PageRequest pageRequest
    ) {
        List<Long> tipificacionesFiltro = normalizarIds(tipificaciones);
        List<Long> subtipificacionesFiltro = normalizarIds(subtipificaciones);
        RangoFechas rangoFechas = resolverRangoFechas(fechaDesde, fechaHasta);

        boolean filtrarProveedor = idProveedor != null;
        boolean filtrarEtapa = etapa != null;
        boolean filtrarFechaDesde = rangoFechas.inicio() != null;
        boolean filtrarFechaHasta = rangoFechas.fin() != null;

        var leads = leadRepository.listarLeadsMasivo(
                filtrarProveedor,
                filtrarProveedor ? idProveedor : -1L,
                filtrarEtapa,
                filtrarEtapa ? etapa : Etapa.PREVENTA,
                !tipificacionesFiltro.isEmpty(),
                tipificacionesFiltro.isEmpty() ? FILTRO_VACIO : tipificacionesFiltro,
                !subtipificacionesFiltro.isEmpty(),
                subtipificacionesFiltro.isEmpty() ? FILTRO_VACIO : subtipificacionesFiltro,
                TIPIFICACIONES_EXCLUIDAS_MASIVO,
                filtrarFechaDesde,
                filtrarFechaDesde ? rangoFechas.inicio() : Instant.EPOCH,
                filtrarFechaHasta,
                filtrarFechaHasta ? rangoFechas.fin() : Instant.EPOCH,
                paginationService.toPageable(pageRequest, MASIVO_SORT_FIELDS)
        );
        var totales = leadAsignacionCounterService.contarAsignacionesPorLeadIds(
                leads.getContent().stream().map(LeadGtrResponse::getId).toList()
        );
        leads.getContent().forEach(lead -> {
            long totalAsignaciones = totales.getOrDefault(lead.getId(), 0L);
            lead.setTotalAsignaciones(totalAsignaciones);
        });
        return PageResponse.from(leads);
    }

    private List<Long> normalizarIds(List<Long> ids) {
        if (ids == null) { return List.of(); }

        return ids.stream()
                .filter(id -> id != null && id > 0)
                .distinct()
                .toList();
    }

    private RangoFechas resolverRangoFechas(LocalDate fechaDesde, LocalDate fechaHasta) {
        if (fechaDesde == null && fechaHasta == null) {
            return new RangoFechas(null, null);
        }
        if (fechaDesde == null) {
            throw new BadRequestException(
                    "Periodo invalido: fechaHasta requiere fechaDesde",
                    null,
                    Map.of("fechaHasta", fechaHasta)
            );
        }

        LocalDate fechaHastaResuelta = fechaHasta == null ? OperationalDateTime.today() : fechaHasta;
        if (fechaDesde.isAfter(fechaHastaResuelta)) {
            throw new BadRequestException(
                    "Periodo invalido: fechaDesde no puede ser mayor que fechaHasta",
                    null,
                    Map.of(
                            "fechaDesde", fechaDesde,
                            "fechaHasta", fechaHastaResuelta
                    )
            );
        }

        Instant inicio = OperationalDateTime.startOfDay(fechaDesde);
        Instant fin = OperationalDateTime.endExclusiveOfDay(fechaHastaResuelta);
        return new RangoFechas(inicio, fin);
    }

    private record RangoFechas(Instant inicio, Instant fin) {
    }
}
