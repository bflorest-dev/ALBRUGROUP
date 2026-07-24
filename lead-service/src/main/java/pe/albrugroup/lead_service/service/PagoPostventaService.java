package pe.albrugroup.lead_service.service;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.albrugroup.lead_service.configuration.CurrentUser;
import pe.albrugroup.lead_service.configuration.OperationalDateTime;
import pe.albrugroup.lead_service.entity.Lead;
import pe.albrugroup.lead_service.entity.PagoPostventa;
import pe.albrugroup.lead_service.entity.PeriodoFacturacionPostventa;
import pe.albrugroup.lead_service.entity.enums.AportantePago;
import pe.albrugroup.lead_service.entity.enums.EstadoPagoPostventa;
import pe.albrugroup.lead_service.entity.enums.EstadoPeriodoFacturacionPostventa;
import pe.albrugroup.lead_service.entity.enums.Etapa;
import pe.albrugroup.lead_service.entity.request.PageRequest;
import pe.albrugroup.lead_service.entity.request.PagoPostventaRequest;
import pe.albrugroup.lead_service.entity.request.PagoPostventaUpdateRequest;
import pe.albrugroup.lead_service.entity.response.PageResponse;
import pe.albrugroup.lead_service.entity.response.PagoPostventaResponse;
import pe.albrugroup.lead_service.exception.BadRequestException;
import pe.albrugroup.lead_service.exception.NotFoundException;
import pe.albrugroup.lead_service.repository.LeadRepository;
import pe.albrugroup.lead_service.repository.PagoPostventaRepository;
import pe.albrugroup.lead_service.repository.PeriodoFacturacionPostventaRepository;
import pe.albrugroup.lead_service.service.mapper.PagoPostventaMapper;

import java.time.LocalDate;
import java.util.Set;

@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class PagoPostventaService {

    private final PagoPostventaRepository pagoRepository;
    private final LeadRepository leadRepository;
    private final PeriodoFacturacionPostventaRepository periodoRepository;
    private final CurrentUser currentUser;
    private final PagoPostventaMapper mapper;
    private final PaginationService paginationService;

    private static final Set<Etapa> ETAPAS_GESTION_POSTVENTA = Set.of(Etapa.POSTVENTA);
    private static final Set<String> PAGO_SORT_FIELDS = Set.of(
            "fechaPago", "fechaCompromisoPago", "estado", "monto", "createdAt"
    );

    @Transactional
    public PagoPostventaResponse registrarPago(Long idLead, PagoPostventaRequest request) {
        Lead lead = obtenerLeadAsignadoGestionable(idLead);
        PeriodoFacturacionPostventa periodo = obtenerPeriodoObligatorio(idLead, request.getIdPeriodoFacturacion());
        validarFechas(periodo, request.getFechaPago(), request.getFechaCompromisoPago());
        PagoPostventa pago = mapper.toEntity(request);
        pago.setLead(lead);
        pago.setPeriodoFacturacionPostventa(periodo);
        pago.setEstado(resolverEstadoPago(pago, null));
        sincronizarPeriodoConPago(pago);
        return mapper.toResponse(pagoRepository.save(pago));
    }

    @Transactional
    public PagoPostventaResponse actualizarPago(Long idPago, PagoPostventaUpdateRequest request) {
        PagoPostventa pago = pagoRepository.findWithLeadById(idPago)
                .orElseThrow(() -> new NotFoundException(PagoPostventa.class, idPago));
        validarLeadAsignadoGestionable(pago.getLead());

        mapper.updateEntity(request, pago);
        if (request.getIdPeriodoFacturacion() != null) {
            pago.setPeriodoFacturacionPostventa(obtenerPeriodoSiCorresponde(
                    pago.getLead().getId(),
                    request.getIdPeriodoFacturacion()
            ));
        }
        validarFechas(pago.getPeriodoFacturacionPostventa(), pago.getFechaPago(), pago.getFechaCompromisoPago());
        pago.setEstado(resolverEstadoPago(pago, request.getEstado()));
        sincronizarPeriodoConPago(pago);
        return mapper.toResponse(pagoRepository.save(pago));
    }

    public PageResponse<PagoPostventaResponse> listarPagosPorLead(Long idLead, PageRequest pageRequest) {
        obtenerLeadAsignadoGestionable(idLead);
        Page<PagoPostventaResponse> pagos = pagoRepository.findByLeadIdOrderByCreatedAtDesc(
                idLead,
                paginationService.toPageable(pageRequest, PAGO_SORT_FIELDS)
        ).map(mapper::toResponse);
        return PageResponse.from(pagos);
    }

    public PageResponse<PagoPostventaResponse> listarPagosPorPeriodo(Long idPeriodoFacturacion, PageRequest pageRequest) {
        PeriodoFacturacionPostventa periodo = periodoRepository.findById(idPeriodoFacturacion)
                .orElseThrow(() -> new NotFoundException(PeriodoFacturacionPostventa.class, idPeriodoFacturacion));
        validarLeadAsignadoGestionable(periodo.getLead());
        Page<PagoPostventaResponse> pagos = pagoRepository.findByPeriodoFacturacionPostventaIdOrderByCreatedAtDesc(
                idPeriodoFacturacion,
                paginationService.toPageable(pageRequest, PAGO_SORT_FIELDS)
        ).map(mapper::toResponse);
        return PageResponse.from(pagos);
    }

    private EstadoPagoPostventa resolverEstadoPago(PagoPostventa pago, EstadoPagoPostventa estadoSolicitado) {
        if (estadoSolicitado == EstadoPagoPostventa.ANULADO) {
            return EstadoPagoPostventa.ANULADO;
        }
        if (pago.getFechaPago() != null) {
            if (pago.getAportante() == null) {
                throw new BadRequestException("aportante es obligatorio cuando existe fechaPago");
            }
            return pago.getAportante() == AportantePago.EMPRESA
                    ? EstadoPagoPostventa.CUBIERTO_EMPRESA
                    : EstadoPagoPostventa.PAGADO;
        }
        if (pago.getAportante() != null) {
            throw new BadRequestException("aportante solo se permite cuando existe fechaPago");
        }
        if (pago.getFechaCompromisoPago() != null) {
            return EstadoPagoPostventa.COMPROMETIDO;
        }
        LocalDate fechaVencimiento = resolverFechaVencimiento(pago.getPeriodoFacturacionPostventa());
        if (fechaVencimiento != null && fechaVencimiento.isBefore(OperationalDateTime.today())) {
            return EstadoPagoPostventa.VENCIDO;
        }
        return EstadoPagoPostventa.PENDIENTE;
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

    private void sincronizarPeriodoConPago(PagoPostventa pago) {
        PeriodoFacturacionPostventa periodo = pago.getPeriodoFacturacionPostventa();
        if (periodo == null) {
            return;
        }
        if (pago.getEstado() == EstadoPagoPostventa.PAGADO
                || pago.getEstado() == EstadoPagoPostventa.CUBIERTO_EMPRESA) {
            periodo.setEstado(EstadoPeriodoFacturacionPostventa.PAGO_CONFIRMADO);
            return;
        }
        if (pago.getEstado() == EstadoPagoPostventa.VENCIDO) {
            periodo.setEstado(EstadoPeriodoFacturacionPostventa.VENCIDO);
            return;
        }
        if (pago.getEstado() == EstadoPagoPostventa.COMPROMETIDO) {
            periodo.setEstado(EstadoPeriodoFacturacionPostventa.PAGO_PENDIENTE);
        }
    }

    private PeriodoFacturacionPostventa obtenerPeriodoObligatorio(Long idLead, Long idPeriodoFacturacion) {
        if (idPeriodoFacturacion == null) {
            throw new BadRequestException("idPeriodoFacturacion es obligatorio");
        }
        return obtenerPeriodoSiCorresponde(idLead, idPeriodoFacturacion);
    }

    private void validarFechas(
            PeriodoFacturacionPostventa periodo,
            LocalDate fechaPago,
            LocalDate fechaCompromisoPago
    ) {
        if (periodo == null) {
            throw new BadRequestException("idPeriodoFacturacion es obligatorio");
        }
        LocalDate fechaEmision = resolverFechaEmision(periodo);
        if (fechaEmision == null) {
            throw new BadRequestException("El periodo no tiene fecha de emision para validar el pago");
        }
        if (fechaPago != null && fechaPago.isBefore(fechaEmision)) {
            throw new BadRequestException("fechaPago no puede ser anterior a fechaEmision");
        }
        if (fechaCompromisoPago != null && fechaCompromisoPago.isBefore(fechaEmision)) {
            throw new BadRequestException("fechaCompromisoPago no puede ser anterior a fechaEmision");
        }
    }

    private LocalDate resolverFechaEmision(PeriodoFacturacionPostventa periodo) {
        if (periodo == null) {
            return null;
        }
        return periodo.getFechaEmisionConfirmada() != null
                ? periodo.getFechaEmisionConfirmada()
                : periodo.getFechaEmisionEstimada();
    }

    private LocalDate resolverFechaVencimiento(PeriodoFacturacionPostventa periodo) {
        if (periodo == null) {
            return null;
        }
        return periodo.getFechaVencimientoConfirmado() != null
                ? periodo.getFechaVencimientoConfirmado()
                : periodo.getFechaVencimientoEstimado();
    }

    private Lead obtenerLeadAsignadoGestionable(Long idLead) {
        return leadRepository.findByIdAndIdAsesorAsignadoAndEtapaIn(
                        idLead,
                        currentUser.empleadoID(),
                        ETAPAS_GESTION_POSTVENTA
                )
                .orElseThrow(() -> new NotFoundException(Lead.class, idLead));
    }

    private void validarLeadAsignadoGestionable(Lead lead) {
        if (lead == null
                || lead.getIdAsesorAsignado() == null
                || !lead.getIdAsesorAsignado().equals(currentUser.empleadoID())
                || !ETAPAS_GESTION_POSTVENTA.contains(lead.getEtapa())) {
            Long idLead = lead == null ? null : lead.getId();
            throw new NotFoundException(Lead.class, idLead);
        }
    }
}
