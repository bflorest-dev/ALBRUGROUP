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
import pe.albrugroup.lead_service.entity.enums.CondicionPagoPostventa;
import pe.albrugroup.lead_service.entity.enums.EstadoClientePostventa;
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
        pago.setCondicion(resolverCondicion(pago.getCondicion()));
        pago.setEstado(resolverEstadoPago(pago));
        aplicarEstadoCliente(lead, pago);
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
        normalizarModoPagoActualizado(request, pago);
        validarFechas(pago.getPeriodoFacturacionPostventa(), pago.getFechaPago(), pago.getFechaCompromisoPago());
        pago.setCondicion(resolverCondicion(pago.getCondicion()));
        pago.setEstado(resolverEstadoPago(pago));
        aplicarEstadoCliente(pago.getLead(), pago);
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

    private EstadoPagoPostventa resolverEstadoPago(PagoPostventa pago) {
        validarPagoVsCompromiso(pago);
        if (pago.getFechaPago() != null) {
            if (pago.getAportante() == null) {
                throw new BadRequestException("aportante es obligatorio cuando existe fechaPago");
            }
            validarCondicionPago(pago);
            validarNumeroOperacion(pago);
            return pago.getAportante() == AportantePago.EMPRESA
                    ? EstadoPagoPostventa.PAGADO_EMPRESA
                    : EstadoPagoPostventa.PAGADO_CLIENTE;
        }
        if (pago.getAportante() != null) {
            throw new BadRequestException("aportante solo se permite cuando existe fechaPago");
        }
        if (pago.getFechaCompromisoPago() != null) {
            if (pago.getCondicion() != CondicionPagoPostventa.NORMAL) {
                throw new BadRequestException("condicion solo se permite cuando existe fechaPago");
            }
            validarFacturaVencidaParaCompromiso(pago.getPeriodoFacturacionPostventa());
            return EstadoPagoPostventa.COMPROMETIDO;
        }
        throw new BadRequestException("Debe registrar fechaPago o fechaCompromisoPago");
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
        if (periodo.getEstado() != EstadoPeriodoFacturacionPostventa.ABIERTO) {
            throw new BadRequestException("No se pueden registrar pagos sobre un periodo cerrado");
        }
        return periodo;
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

    private void normalizarModoPagoActualizado(PagoPostventaUpdateRequest request, PagoPostventa pago) {
        if (request.getFechaPago() != null) {
            pago.setFechaCompromisoPago(null);
            return;
        }
        if (request.getFechaCompromisoPago() != null) {
            pago.setFechaPago(null);
            pago.setAportante(null);
            pago.setNumeroOperacion(null);
            pago.setCondicion(CondicionPagoPostventa.NORMAL);
        }
    }

    private void validarPagoVsCompromiso(PagoPostventa pago) {
        if (pago.getFechaPago() != null && pago.getFechaCompromisoPago() != null) {
            throw new BadRequestException("No se puede registrar fechaPago y fechaCompromisoPago en el mismo pago");
        }
    }

    private CondicionPagoPostventa resolverCondicion(CondicionPagoPostventa condicion) {
        return condicion == null ? CondicionPagoPostventa.NORMAL : condicion;
    }

    private void validarCondicionPago(PagoPostventa pago) {
        CondicionPagoPostventa condicion = resolverCondicion(pago.getCondicion());
        if ((condicion == CondicionPagoPostventa.REINTEGRO
                || condicion == CondicionPagoPostventa.CASHBACK_POSTVENTA)
                && pago.getAportante() != AportantePago.EMPRESA) {
            throw new BadRequestException("La condicion " + condicion + " se registra como pago de EMPRESA");
        }
        if (condicion == CondicionPagoPostventa.CASHBACK_ASESOR_VENTAS
                && pago.getAportante() != AportantePago.CLIENTE) {
            throw new BadRequestException("La condicion CASHBACK_ASESOR_VENTAS se registra como pago de CLIENTE");
        }
    }

    private void validarNumeroOperacion(PagoPostventa pago) {
        boolean requiereNumeroOperacion = pago.getAportante() == AportantePago.EMPRESA;
        if (requiereNumeroOperacion
                && (pago.getNumeroOperacion() == null || pago.getNumeroOperacion().isBlank())) {
            throw new BadRequestException("numeroOperacion es obligatorio cuando paga la empresa");
        }
    }

    private void validarFacturaVencidaParaCompromiso(PeriodoFacturacionPostventa periodo) {
        LocalDate fechaVencimiento = resolverFechaVencimiento(periodo);
        if (fechaVencimiento == null) {
            throw new BadRequestException("El periodo no tiene fecha de vencimiento para registrar compromiso");
        }
        if (!fechaVencimiento.isBefore(OperationalDateTime.today())) {
            throw new BadRequestException("Solo se puede registrar compromiso de pago cuando la factura esta vencida");
        }
    }

    private void aplicarEstadoCliente(Lead lead, PagoPostventa pago) {
        if (lead == null) {
            return;
        }
        if (pago.getEstado() == EstadoPagoPostventa.PAGADO_EMPRESA
                || pago.getEstado() == EstadoPagoPostventa.COMPROMETIDO) {
            lead.setEstadoClientePostventa(EstadoClientePostventa.SUSPENDIDO);
            return;
        }
        if (pago.getEstado() == EstadoPagoPostventa.PAGADO_CLIENTE) {
            lead.setEstadoClientePostventa(EstadoClientePostventa.ACTIVO);
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
