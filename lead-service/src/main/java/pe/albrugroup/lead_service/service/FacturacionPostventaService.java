package pe.albrugroup.lead_service.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.albrugroup.lead_service.entity.CalendarioFacturacionPostventa;
import pe.albrugroup.lead_service.entity.Lead;
import pe.albrugroup.lead_service.entity.PeriodoFacturacionPostventa;
import pe.albrugroup.lead_service.entity.enums.EstadoPeriodoFacturacionPostventa;
import pe.albrugroup.lead_service.entity.enums.EstadoPostventa;
import pe.albrugroup.lead_service.entity.enums.EstadoSeguimiento;
import pe.albrugroup.lead_service.entity.enums.Etapa;
import pe.albrugroup.lead_service.entity.request.CerrarPeriodoFacturacionRequest;
import pe.albrugroup.lead_service.entity.request.PeriodoFacturacionFacturaRequest;
import pe.albrugroup.lead_service.entity.response.PeriodoFacturacionPostventaResponse;
import pe.albrugroup.lead_service.exception.BadRequestException;
import pe.albrugroup.lead_service.exception.NotFoundException;
import pe.albrugroup.lead_service.repository.PeriodoFacturacionPostventaRepository;
import pe.albrugroup.lead_service.configuration.OperationalDateTime;
import pe.albrugroup.lead_service.service.facturacion.CalculadoraFacturacionPostventa;
import pe.albrugroup.lead_service.service.facturacion.CalculadoraFacturacionPostventaResolver;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class FacturacionPostventaService {

    private final PeriodoFacturacionPostventaRepository periodoRepository;
    private final CalculadoraFacturacionPostventaResolver calculadoraResolver;

    public List<PeriodoFacturacionPostventaResponse> listarPeriodosPorLead(Long idLead) {
        return periodoRepository.findByLeadIdOrderByNumeroPeriodoAsc(idLead).stream()
                .map(this::toResponse)
                .toList();
    }

    public PeriodoFacturacionPostventaResponse obtenerPeriodo(Long idPeriodo) {
        return toResponse(obtenerPeriodoEntity(idPeriodo));
    }

    @Transactional
    public PeriodoFacturacionPostventaResponse confirmarFactura(
            Long idPeriodo,
            PeriodoFacturacionFacturaRequest request
    ) {
        PeriodoFacturacionPostventa periodo = obtenerPeriodoEntity(idPeriodo);
        validarFechasFactura(request);

        periodo.setFechaEmisionConfirmada(request.getFechaEmisionConfirmada());
        periodo.setFechaVencimientoConfirmado(request.getFechaVencimientoConfirmado());
        periodo.setMontoFacturado(request.getMontoFacturado());
        periodo.setObservacion(request.getObservacion());
        periodo.setEstado(EstadoPeriodoFacturacionPostventa.PAGO_PENDIENTE);

        return toResponse(periodoRepository.save(periodo));
    }

    @Transactional
    public PeriodoFacturacionPostventaResponse cerrarPeriodo(
            Long idPeriodo,
            CerrarPeriodoFacturacionRequest request
    ) {
        PeriodoFacturacionPostventa periodo = obtenerPeriodoEntity(idPeriodo);
        validarEstadoCierre(request.getEstado());

        periodo.setEstado(request.getEstado());
        if (request.getObservacion() != null) {
            periodo.setObservacion(request.getObservacion());
        }

        PeriodoFacturacionPostventa saved = periodoRepository.save(periodo);
        if (debeCrearSiguientePeriodo(saved, request)) {
            crearSiguientePeriodo(saved);
        } else if (debeEnviarACobranzaPorPermanencia(saved)) {
            enviarLeadACobranza(saved.getLead());
        }

        return toResponse(saved);
    }

    private PeriodoFacturacionPostventa obtenerPeriodoEntity(Long idPeriodo) {
        return periodoRepository.findById(idPeriodo)
                .orElseThrow(() -> new NotFoundException(PeriodoFacturacionPostventa.class, idPeriodo));
    }

    private void validarFechasFactura(PeriodoFacturacionFacturaRequest request) {
        if (request.getFechaEmisionConfirmada() != null
                && request.getFechaVencimientoConfirmado() != null
                && request.getFechaVencimientoConfirmado().isBefore(request.getFechaEmisionConfirmada())) {
            throw new BadRequestException("fechaVencimientoConfirmado no puede ser anterior a fechaEmisionConfirmada");
        }
    }

    private void validarEstadoCierre(EstadoPeriodoFacturacionPostventa estado) {
        if (estado == EstadoPeriodoFacturacionPostventa.PROGRAMADO
                || estado == EstadoPeriodoFacturacionPostventa.FACTURA_EMITIDA
                || estado == EstadoPeriodoFacturacionPostventa.PAGO_PENDIENTE) {
            throw new BadRequestException("El estado indicado no cierra el periodo: " + estado);
        }
    }

    private boolean debeCrearSiguientePeriodo(
            PeriodoFacturacionPostventa periodo,
            CerrarPeriodoFacturacionRequest request
    ) {
        if (request.getCrearSiguientePeriodo() != null && !request.getCrearSiguientePeriodo()) {
            return false;
        }
        if (periodo.getEstado() != EstadoPeriodoFacturacionPostventa.PAGO_CONFIRMADO) {
            return false;
        }
        Lead lead = periodo.getLead();
        if (lead == null || lead.getEstadoPostventa() == EstadoPostventa.BAJA_CONFIRMADA
                || lead.getEstadoPostventa() == EstadoPostventa.NO_EFECTIVO) {
            return false;
        }
        CalendarioFacturacionPostventa calendario = periodo.getCalendarioFacturacionPostventa();
        Integer mesesPermanencia = calendario == null ? null : calendario.getMesesPermanenciaSnapshot();
        if (mesesPermanencia == null || mesesPermanencia <= 0) {
            return true;
        }
        return periodo.getNumeroPeriodo() != null && periodo.getNumeroPeriodo() < mesesPermanencia;
    }

    private boolean debeEnviarACobranzaPorPermanencia(PeriodoFacturacionPostventa periodo) {
        if (periodo.getEstado() != EstadoPeriodoFacturacionPostventa.PAGO_CONFIRMADO) {
            return false;
        }
        Lead lead = periodo.getLead();
        if (lead == null || lead.getEtapa() != Etapa.POSTVENTA || lead.getEstadoPostventa() == EstadoPostventa.BAJA_CONFIRMADA
                || lead.getEstadoPostventa() == EstadoPostventa.NO_EFECTIVO) {
            return false;
        }
        CalendarioFacturacionPostventa calendario = periodo.getCalendarioFacturacionPostventa();
        Integer mesesPermanencia = calendario == null ? null : calendario.getMesesPermanenciaSnapshot();
        return mesesPermanencia != null
                && mesesPermanencia > 0
                && periodo.getNumeroPeriodo() != null
                && periodo.getNumeroPeriodo() >= mesesPermanencia;
    }

    private void enviarLeadACobranza(Lead lead) {
        lead.setEtapa(Etapa.COBRANZA);
        lead.setLastEntryAt(OperationalDateTime.now());
        lead.setEstado(EstadoSeguimiento.NUEVO);
        lead.setIdAsesorAsignado(null);
        lead.setNombreAsesorAsignado(null);
        lead.setIdTipificacion(null);
        lead.setCodigoTipificacion(null);
        lead.setIdSubtipificacion(null);
        lead.setCodigoSubtipificacion(null);
        lead.setEstadoPostventa(EstadoPostventa.EFECTIVO);
    }

    private void crearSiguientePeriodo(PeriodoFacturacionPostventa periodo) {
        CalendarioFacturacionPostventa calendario = periodo.getCalendarioFacturacionPostventa();
        if (calendario == null || periodo.getNumeroPeriodo() == null) {
            return;
        }
        int siguienteNumero = periodo.getNumeroPeriodo() + 1;
        boolean yaExiste = periodoRepository.findByCalendarioFacturacionPostventaIdAndNumeroPeriodo(
                calendario.getId(),
                siguienteNumero
        ).isPresent();
        if (yaExiste) {
            return;
        }

        CalculadoraFacturacionPostventa calculadora = calculadoraResolver.resolver(calendario.getProveedorSnapshot());
        periodoRepository.save(calculadora.crearPeriodo(calendario, siguienteNumero));
    }

    private PeriodoFacturacionPostventaResponse toResponse(PeriodoFacturacionPostventa periodo) {
        return PeriodoFacturacionPostventaResponse.builder()
                .id(periodo.getId())
                .idCalendarioFacturacion(periodo.getCalendarioFacturacionPostventa() == null
                        ? null
                        : periodo.getCalendarioFacturacionPostventa().getId())
                .idLead(periodo.getLead() == null ? null : periodo.getLead().getId())
                .numeroPeriodo(periodo.getNumeroPeriodo())
                .fechaInicioPeriodo(periodo.getFechaInicioPeriodo())
                .fechaFinPeriodo(periodo.getFechaFinPeriodo())
                .fechaCorteEstimada(periodo.getFechaCorteEstimada())
                .fechaEmisionEstimada(periodo.getFechaEmisionEstimada())
                .fechaEmisionConfirmada(periodo.getFechaEmisionConfirmada())
                .fechaVencimientoEstimado(periodo.getFechaVencimientoEstimado())
                .fechaVencimientoConfirmado(periodo.getFechaVencimientoConfirmado())
                .montoEsperado(periodo.getMontoEsperado())
                .montoProrrateo(periodo.getMontoProrrateo())
                .montoFacturado(periodo.getMontoFacturado())
                .estado(periodo.getEstado())
                .observacion(periodo.getObservacion())
                .createdAt(periodo.getCreatedAt())
                .updatedAt(periodo.getUpdatedAt())
                .build();
    }
}
