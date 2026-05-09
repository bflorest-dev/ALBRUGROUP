package pe.albrugroup.lead_service.service;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.albrugroup.lead_service.configuration.CurrentUser;
import pe.albrugroup.lead_service.entity.Lead;
import pe.albrugroup.lead_service.entity.PagoPostventa;
import pe.albrugroup.lead_service.entity.enums.AportantePago;
import pe.albrugroup.lead_service.entity.enums.EstadoPagoPostventa;
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
import pe.albrugroup.lead_service.service.mapper.PagoPostventaMapper;

import java.time.LocalDate;
import java.util.Set;

@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class PagoPostventaService {

    private final PagoPostventaRepository pagoRepository;
    private final LeadRepository leadRepository;
    private final CurrentUser currentUser;
    private final PagoPostventaMapper mapper;
    private final PaginationService paginationService;

    private static final Set<Etapa> ETAPAS_GESTION_POSTVENTA = Set.of(Etapa.POSTVENTA, Etapa.COBRANZA);
    private static final Set<String> PAGO_SORT_FIELDS = Set.of(
            "fechaVencimiento", "fechaEmision", "fechaPago", "estado", "monto", "createdAt"
    );

    @Transactional
    public PagoPostventaResponse registrarPago(Long idLead, PagoPostventaRequest request) {
        Lead lead = obtenerLeadAsignadoGestionable(idLead);
        validarFechas(request.getFechaEmision(), request.getFechaVencimiento(), request.getFechaPago(), request.getFechaCompromisoPago());
        PagoPostventa pago = mapper.toEntity(request);
        pago.setLead(lead);
        pago.setEstado(resolverEstadoPago(pago, null));
        return mapper.toResponse(pagoRepository.save(pago));
    }

    @Transactional
    public PagoPostventaResponse actualizarPago(Long idPago, PagoPostventaUpdateRequest request) {
        PagoPostventa pago = pagoRepository.findWithLeadById(idPago)
                .orElseThrow(() -> new NotFoundException(PagoPostventa.class, idPago));
        validarLeadAsignadoGestionable(pago.getLead());

        mapper.updateEntity(request, pago);
        validarFechas(pago.getFechaEmision(), pago.getFechaVencimiento(), pago.getFechaPago(), pago.getFechaCompromisoPago());
        pago.setEstado(resolverEstadoPago(pago, request.getEstado()));
        return mapper.toResponse(pagoRepository.save(pago));
    }

    public PageResponse<PagoPostventaResponse> listarPagosPorLead(Long idLead, PageRequest pageRequest) {
        obtenerLeadAsignadoGestionable(idLead);
        Page<PagoPostventaResponse> pagos = pagoRepository.findByLeadIdOrderByFechaVencimientoAsc(
                idLead,
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
        if (pago.getFechaVencimiento() != null && pago.getFechaVencimiento().isBefore(LocalDate.now())) {
            return EstadoPagoPostventa.VENCIDO;
        }
        return EstadoPagoPostventa.PENDIENTE;
    }

    private void validarFechas(
            LocalDate fechaEmision,
            LocalDate fechaVencimiento,
            LocalDate fechaPago,
            LocalDate fechaCompromisoPago
    ) {
        if (fechaEmision == null) {
            throw new BadRequestException("fechaEmision es obligatoria");
        }
        if (fechaVencimiento == null) {
            throw new BadRequestException("fechaVencimiento es obligatoria");
        }
        if (fechaVencimiento.isBefore(fechaEmision)) {
            throw new BadRequestException("fechaVencimiento no puede ser anterior a fechaEmision");
        }
        if (fechaPago != null && fechaPago.isBefore(fechaEmision)) {
            throw new BadRequestException("fechaPago no puede ser anterior a fechaEmision");
        }
        if (fechaCompromisoPago != null && fechaCompromisoPago.isBefore(fechaEmision)) {
            throw new BadRequestException("fechaCompromisoPago no puede ser anterior a fechaEmision");
        }
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
