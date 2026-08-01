package pe.albrugroup.lead_service.service;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.albrugroup.lead_service.entity.CalendarioFacturacionPostventa;
import pe.albrugroup.lead_service.entity.DatosPreventa;
import pe.albrugroup.lead_service.entity.EncuestaPostventa;
import pe.albrugroup.lead_service.entity.EntregaCredencialPlataforma;
import pe.albrugroup.lead_service.entity.Lead;
import pe.albrugroup.lead_service.entity.PeriodoFacturacionPostventa;
import pe.albrugroup.lead_service.entity.Plataforma;
import pe.albrugroup.lead_service.entity.enums.Accion;
import pe.albrugroup.lead_service.entity.enums.EstadoClientePostventa;
import pe.albrugroup.lead_service.entity.enums.EstadoCredencialPlataforma;
import pe.albrugroup.lead_service.entity.enums.EstadoCredencialesPostventa;
import pe.albrugroup.lead_service.entity.enums.EstadoEntregaCredencial;
import pe.albrugroup.lead_service.entity.enums.EstadoPagoPeriodoPostventa;
import pe.albrugroup.lead_service.entity.enums.EstadoPeriodoFacturacionPostventa;
import pe.albrugroup.lead_service.entity.enums.EstadoPlataformaDigitalLead;
import pe.albrugroup.lead_service.entity.enums.EstadoServicioPostventa;
import pe.albrugroup.lead_service.entity.enums.Etapa;
import pe.albrugroup.lead_service.entity.request.PageRequest;
import pe.albrugroup.lead_service.entity.response.LeadPostventaBandejaResponse;
import pe.albrugroup.lead_service.entity.response.LeadPostventaBusquedaResponse;
import pe.albrugroup.lead_service.entity.response.PageResponse;
import pe.albrugroup.lead_service.repository.CalendarioFacturacionPostventaRepository;
import pe.albrugroup.lead_service.repository.EncuestaPostventaRepository;
import pe.albrugroup.lead_service.repository.EntregaCredencialPlataformaRepository;
import pe.albrugroup.lead_service.repository.EventoRepository;
import pe.albrugroup.lead_service.repository.LeadRepository;
import pe.albrugroup.lead_service.repository.PeriodoFacturacionPostventaRepository;

import java.time.LocalDate;
import java.time.Instant;
import java.util.Collection;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class PostventaBandejaService {

    private final CalendarioFacturacionPostventaRepository calendarioRepository;
    private final EncuestaPostventaRepository encuestaRepository;
    private final EntregaCredencialPlataformaRepository entregaCredencialRepository;
    private final EventoRepository eventoRepository;
    private final LeadRepository leadRepository;
    private final PeriodoFacturacionPostventaRepository periodoRepository;
    private final PaginationService paginationService;

    private static final Set<String> BANDEJA_SORT_FIELDS = Set.of(
            "fechaInstalacion", "createdAt", "updatedAt"
    );

    private static final List<Accion> ACCIONES_GESTION_POSTVENTA = List.of(
            Accion.CONTACTO,
            Accion.TIPIFICACION,
            Accion.ASIGNACION
    );

    public PageResponse<LeadPostventaBandejaResponse> listarBandeja(
            PageRequest pageRequest,
            LocalDate mesCorteBase,
            Integer numeroCorteBase
    ) {
        Pageable pageable = paginationService.toPageable(normalizarOrden(pageRequest), BANDEJA_SORT_FIELDS);
        Page<CalendarioFacturacionPostventa> calendarios = mesCorteBase == null || numeroCorteBase == null
                ? calendarioRepository.listarBandejaPostventa(Etapa.POSTVENTA, pageable)
                : calendarioRepository.listarBandejaPostventaPorCorte(
                        Etapa.POSTVENTA,
                        mesCorteBase,
                        numeroCorteBase,
                        pageable
                );

        List<Long> leadIds = calendarios.getContent().stream()
                .map(CalendarioFacturacionPostventa::getLead)
                .map(Lead::getId)
                .toList();

        Map<Long, EncuestaPostventa> ultimasEncuestas = obtenerUltimasEncuestas(leadIds);
        Map<Long, EstadoPlataformaDigitalLead> estadosPlataforma = resolverEstadosPlataforma(leadIds);
        Map<Long, PeriodoFacturacionPostventa> periodosVigentes = obtenerPeriodosVigentes(leadIds);
        Map<Long, UltimaGestion> ultimasGestiones = obtenerUltimasGestiones(leadIds);

        Page<LeadPostventaBandejaResponse> responsePage = calendarios.map(calendario -> toResponse(
                calendario,
                ultimasEncuestas.get(calendario.getLead().getId()),
                estadosPlataforma.getOrDefault(calendario.getLead().getId(), EstadoPlataformaDigitalLead.NO_ENTREGADA),
                periodosVigentes.get(calendario.getLead().getId()),
                ultimasGestiones.get(calendario.getLead().getId())
        ));

        return PageResponse.from(responsePage);
    }

    public LeadPostventaBusquedaResponse buscarLead(String buscar) {
        String criterio = buscar == null ? null : buscar.trim();
        if (criterio == null || criterio.isBlank()) {
            return LeadPostventaBusquedaResponse.builder()
                    .existe(false)
                    .mensajeUsuario("Escribe el numero de lead o documento que quieres buscar.")
                    .build();
        }

        Lead lead = leadRepository.buscarPorLeadODocumento(criterio).stream().findFirst().orElse(null);
        if (lead == null) {
            return LeadPostventaBusquedaResponse.builder()
                    .existe(false)
                    .mensajeUsuario("No encontramos ese lead o documento en el sistema.")
                    .build();
        }
        if (lead.getEtapa() != Etapa.POSTVENTA && lead.getEtapa() != Etapa.COBRANZA) {
            return LeadPostventaBusquedaResponse.builder()
                    .existe(true)
                    .etapaActual(lead.getEtapa())
                    .mensajeUsuario("El lead existe, pero actualmente esta en etapa " + lead.getEtapa() + ".")
                    .build();
        }

        CalendarioFacturacionPostventa calendario = calendarioRepository.findWithLeadByLeadId(lead.getId())
                .orElse(null);
        if (calendario == null) {
            return LeadPostventaBusquedaResponse.builder()
                    .existe(true)
                    .etapaActual(lead.getEtapa())
                    .mensajeUsuario("El lead esta en " + lead.getEtapa() + ", pero aun no tiene calendario de Postventa.")
                    .build();
        }

        Long idLead = lead.getId();
        LeadPostventaBandejaResponse row = toResponse(
                calendario,
                obtenerUltimasEncuestas(List.of(idLead)).get(idLead),
                resolverEstadosPlataforma(List.of(idLead)).getOrDefault(idLead, EstadoPlataformaDigitalLead.NO_ENTREGADA),
                obtenerPeriodosVigentes(List.of(idLead)).get(idLead),
                obtenerUltimasGestiones(List.of(idLead)).get(idLead)
        );
        return LeadPostventaBusquedaResponse.builder()
                .existe(true)
                .etapaActual(lead.getEtapa())
                .lead(row)
                .build();
    }

    private PageRequest normalizarOrden(PageRequest request) {
        if (!"createdAt".equals(request.getSortBy())) {
            return request;
        }
        return PageRequest.builder()
                .pageNumber(request.getPageNumber())
                .pageSize(request.getPageSize())
                .sortBy("fechaInstalacion")
                .direction("desc")
                .build();
    }

    private Map<Long, EncuestaPostventa> obtenerUltimasEncuestas(Collection<Long> leadIds) {
        if (leadIds.isEmpty()) {
            return Map.of();
        }
        Map<Long, EncuestaPostventa> porLead = new HashMap<>();
        for (EncuestaPostventa encuesta : encuestaRepository.listarUltimasPorLeadIds(leadIds)) {
            porLead.put(encuesta.getLead().getId(), encuesta);
        }
        return porLead;
    }

    private Map<Long, EstadoPlataformaDigitalLead> resolverEstadosPlataforma(Collection<Long> leadIds) {
        if (leadIds.isEmpty()) {
            return Map.of();
        }
        Map<Long, List<EntregaCredencialPlataforma>> entregasPorLead = new HashMap<>();
        for (EntregaCredencialPlataforma entrega : entregaCredencialRepository.listarPorLeadIds(leadIds)) {
            entregasPorLead.computeIfAbsent(entrega.getLead().getId(), ignored -> new java.util.ArrayList<>())
                    .add(entrega);
        }

        Map<Long, EstadoPlataformaDigitalLead> estados = new HashMap<>();
        for (Map.Entry<Long, List<EntregaCredencialPlataforma>> entry : entregasPorLead.entrySet()) {
            EntregaCredencialPlataforma ultima = entry.getValue().stream()
                    .max(Comparator.comparing(
                            EntregaCredencialPlataforma::getCreatedAt,
                            Comparator.nullsLast(Comparator.naturalOrder())
                    ))
                    .orElse(null);
            estados.put(entry.getKey(), resolverEstadoPlataforma(ultima));
        }
        return estados;
    }

    private Map<Long, PeriodoFacturacionPostventa> obtenerPeriodosVigentes(Collection<Long> leadIds) {
        if (leadIds.isEmpty()) {
            return Map.of();
        }
        Map<Long, PeriodoFacturacionPostventa> porLead = new HashMap<>();
        for (PeriodoFacturacionPostventa periodo : periodoRepository.findByLeadIdInOrderByLeadIdAscNumeroPeriodoDesc(leadIds)) {
            porLead.putIfAbsent(periodo.getLead().getId(), periodo);
        }
        return porLead;
    }

    private EstadoPlataformaDigitalLead resolverEstadoPlataforma(EntregaCredencialPlataforma entrega) {
        if (entrega == null) {
            return EstadoPlataformaDigitalLead.NO_ENTREGADA;
        }
        if (entrega.getEstado() == EstadoEntregaCredencial.CANCELADA) {
            return EstadoPlataformaDigitalLead.CANCELADA;
        }
        if (entrega.getEstado() == EstadoEntregaCredencial.REEMPLAZADA) {
            return EstadoPlataformaDigitalLead.REEMPLAZADA;
        }
        if (entrega.getEstado() == EstadoEntregaCredencial.EXPIRADA) {
            return EstadoPlataformaDigitalLead.EXPIRADA;
        }
        if (entrega.getCredencial() != null) {
            EstadoCredencialPlataforma estadoCredencial = entrega.getCredencial().getEstado();
            if (estadoCredencial == EstadoCredencialPlataforma.EXPIRADA) {
                return EstadoPlataformaDigitalLead.EXPIRADA;
            }
            if (estadoCredencial == EstadoCredencialPlataforma.SUSPENDIDA) {
                return EstadoPlataformaDigitalLead.SUSPENDIDA;
            }
        }
        return EstadoPlataformaDigitalLead.ACTIVA;
    }

    private Map<Long, UltimaGestion> obtenerUltimasGestiones(Collection<Long> leadIds) {
        if (leadIds.isEmpty()) {
            return Map.of();
        }
        Map<Long, UltimaGestion> porLead = new HashMap<>();
        for (Object[] row : eventoRepository.listarUltimaGestionPorLeadIdsEtapaYAcciones(
                leadIds,
                Etapa.POSTVENTA,
                ACCIONES_GESTION_POSTVENTA
        )) {
            porLead.put((Long) row[0], new UltimaGestion((String) row[1], (Instant) row[2]));
        }
        return porLead;
    }

    private LeadPostventaBandejaResponse toResponse(
            CalendarioFacturacionPostventa calendario,
            EncuestaPostventa ultimaEncuesta,
            EstadoPlataformaDigitalLead estadoPlataforma,
            PeriodoFacturacionPostventa periodoVigente,
            UltimaGestion ultimaGestion
    ) {
        Lead lead = calendario.getLead();
        DatosPreventa datos = lead.getDatosPreventa();
        return LeadPostventaBandejaResponse.builder()
                .idLead(lead.getId())
                .fechaInstalacion(calendario.getFechaInstalacion())
                .tipoDocumento(datos == null ? null : datos.getTipoDocumento())
                .numeroDocumento(datos == null
                        ? lead.getNumeroDocumentoTitularServicioSnapshot()
                        : datos.getNumeroDocumentoTitularServicio())
                .lead(lead.getLead())
                .nombreCliente(datos == null ? null : datos.getNombreTitularServicio())
                .telefonoRegistro(datos == null ? null : datos.getCelularRegistro())
                .proveedor(calendario.getProveedorSnapshot())
                .plan(calendario.getPlanSnapshot())
                .mesCorteBase(calendario.getMesCorteBase())
                .numeroCorteBase(calendario.getNumeroCorteBase())
                .corteCorregido(calendario.getCorteCorregido())
                .fechaCorreccionCorte(calendario.getFechaCorreccionCorte())
                .idPlataformaDigitalOfrecida(obtenerIdPlataformaDigitalOfrecida(lead))
                .plataformaDigitalOfrecida(obtenerNombrePlataformaDigitalOfrecida(lead))
                .estadoCliente(resolverEstadoCliente(lead.getEstadoClientePostventa()))
                .estadoCredenciales(resolverEstadoCredenciales(lead, estadoPlataforma))
                .estadoPago(resolverEstadoPago(periodoVigente))
                .estadoServicio(resolverEstadoServicio(ultimaEncuesta))
                .estadoPlataformaDigital(estadoPlataforma)
                .ultimoGestor(ultimaGestion == null ? null : ultimaGestion.nombreGestor())
                .ultimaGestion(ultimaGestion == null ? null : ultimaGestion.fechaGestion())
                .build();
    }

    private EstadoClientePostventa resolverEstadoCliente(EstadoClientePostventa estadoCliente) {
        return estadoCliente == null ? EstadoClientePostventa.ACTIVO : estadoCliente;
    }

    private EstadoCredencialesPostventa resolverEstadoCredenciales(
            Lead lead,
            EstadoPlataformaDigitalLead estadoPlataforma
    ) {
        if (lead.getPlataformaDigitalOfrecida() == null) {
            return EstadoCredencialesPostventa.NO_REQUIERE;
        }
        if (estadoPlataforma == null || estadoPlataforma == EstadoPlataformaDigitalLead.NO_ENTREGADA) {
            return EstadoCredencialesPostventa.PENDIENTES;
        }
        if (estadoPlataforma == EstadoPlataformaDigitalLead.ACTIVA) {
            return EstadoCredencialesPostventa.ENTREGADAS;
        }
        return EstadoCredencialesPostventa.PENDIENTES;
    }

    private Long obtenerIdPlataformaDigitalOfrecida(Lead lead) {
        Plataforma plataforma = lead.getPlataformaDigitalOfrecida();
        return plataforma == null ? null : plataforma.getId();
    }

    private String obtenerNombrePlataformaDigitalOfrecida(Lead lead) {
        Plataforma plataforma = lead.getPlataformaDigitalOfrecida();
        return plataforma == null ? null : plataforma.getNombre();
    }

    private EstadoPagoPeriodoPostventa resolverEstadoPago(PeriodoFacturacionPostventa periodo) {
        if (periodo == null) {
            return EstadoPagoPeriodoPostventa.POR_EMITIR;
        }
        if (periodo.getEstado() == EstadoPeriodoFacturacionPostventa.CERRADO_PAGO_CLIENTE
                || periodo.getEstado() == EstadoPeriodoFacturacionPostventa.CERRADO_PAGO_EMPRESA) {
            return EstadoPagoPeriodoPostventa.PAGADA;
        }
        if (periodo.getEstado() == EstadoPeriodoFacturacionPostventa.CERRADO_BAJA
                || periodo.getEstado() == EstadoPeriodoFacturacionPostventa.CERRADO_BAJA_ADEUDO) {
            return EstadoPagoPeriodoPostventa.VENCIDA;
        }

        LocalDate hoy = LocalDate.now();
        LocalDate fechaEmision = periodo.getFechaEmisionConfirmada() != null
                ? periodo.getFechaEmisionConfirmada()
                : periodo.getFechaEmisionEstimada();
        LocalDate fechaVencimiento = periodo.getFechaVencimientoConfirmado() != null
                ? periodo.getFechaVencimientoConfirmado()
                : periodo.getFechaVencimientoEstimado();

        if (fechaVencimiento != null && hoy.isAfter(fechaVencimiento)) {
            return EstadoPagoPeriodoPostventa.VENCIDA;
        }
        if (fechaEmision != null && hoy.isBefore(fechaEmision)) {
            return EstadoPagoPeriodoPostventa.POR_EMITIR;
        }
        return EstadoPagoPeriodoPostventa.PENDIENTE_PAGO;
    }

    private EstadoServicioPostventa resolverEstadoServicio(EncuestaPostventa encuesta) {
        if (encuesta == null || encuesta.getCalificacion() == null) {
            return EstadoServicioPostventa.SIN_CALIFICAR;
        }
        if (encuesta.getCalificacion() <= 6) {
            return EstadoServicioPostventa.INSATISFECHO;
        }
        if (encuesta.getCalificacion() <= 8) {
            return EstadoServicioPostventa.SATISFECHO;
        }
        return EstadoServicioPostventa.MUY_SATISFECHO;
    }

    private record UltimaGestion(String nombreGestor, Instant fechaGestion) {
    }
}
