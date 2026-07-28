package pe.albrugroup.lead_service.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.albrugroup.lead_service.entity.CalendarioFacturacionPostventa;
import pe.albrugroup.lead_service.entity.Lead;
import pe.albrugroup.lead_service.entity.PeriodoFacturacionPostventa;
import pe.albrugroup.lead_service.entity.enums.BloqueFacturacion;
import pe.albrugroup.lead_service.entity.enums.EstadoClientePostventa;
import pe.albrugroup.lead_service.entity.enums.EstadoPeriodoFacturacionPostventa;
import pe.albrugroup.lead_service.entity.enums.EstadoSeguimiento;
import pe.albrugroup.lead_service.entity.enums.Etapa;
import pe.albrugroup.lead_service.entity.enums.TipoReglaFacturacion;
import pe.albrugroup.lead_service.entity.request.CerrarPeriodoFacturacionRequest;
import pe.albrugroup.lead_service.entity.request.CorregirCorteFacturacionRequest;
import pe.albrugroup.lead_service.entity.request.PeriodoFacturacionFacturaRequest;
import pe.albrugroup.lead_service.entity.response.CalendarioFacturacionPostventaResponse;
import pe.albrugroup.lead_service.entity.response.CorreccionCorteFacturacionResponse;
import pe.albrugroup.lead_service.entity.response.PeriodoFacturacionPostventaResponse;
import pe.albrugroup.lead_service.exception.BadRequestException;
import pe.albrugroup.lead_service.exception.NotFoundException;
import pe.albrugroup.lead_service.repository.CalendarioFacturacionPostventaRepository;
import pe.albrugroup.lead_service.repository.PagoPostventaRepository;
import pe.albrugroup.lead_service.repository.PeriodoFacturacionPostventaRepository;
import pe.albrugroup.lead_service.configuration.OperationalDateTime;
import pe.albrugroup.lead_service.service.facturacion.CalculadoraFacturacionPostventa;
import pe.albrugroup.lead_service.service.facturacion.CalculadoraFacturacionPostventaResolver;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class FacturacionPostventaService {

    private static final int NUMERO_PERIODO_INICIAL = 1;
    private static final int CORTE_WIN_PRIMERO = 1;
    private static final int CORTE_WIN_SEGUNDO = 2;

    private final CalendarioFacturacionPostventaRepository calendarioRepository;
    private final PeriodoFacturacionPostventaRepository periodoRepository;
    private final PagoPostventaRepository pagoRepository;
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
    public CorreccionCorteFacturacionResponse corregirCorteCalendario(
            Long idCalendario,
            CorregirCorteFacturacionRequest request
    ) {
        CalendarioFacturacionPostventa calendario = obtenerCalendarioConLead(idCalendario);
        PeriodoFacturacionPostventa periodoUno = obtenerPeriodoUno(calendario);
        validarMesCorteBase(request);
        validarProveedorWin(calendario);
        validarLeadEnPostventa(calendario);
        validarPeriodoUno(periodoUno);
        validarCorteNoCorregido(calendario);
        validarNoExistePagoRegistrado(periodoUno);
        validarPeriodoNoCerrado(periodoUno);
        validarCorteSiguientePermitido(calendario, request);

        aplicarCorreccionCorte(calendario, request);
        PeriodoFacturacionPostventa periodoRecalculado = recalcularPeriodoUno(calendario, periodoUno);

        return CorreccionCorteFacturacionResponse.builder()
                .calendario(toCalendarioResponse(calendarioRepository.save(calendario)))
                .periodoRecalculado(toResponse(periodoRepository.save(periodoRecalculado)))
                .build();
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

    private CalendarioFacturacionPostventa obtenerCalendarioConLead(Long idCalendario) {
        return calendarioRepository.findWithLeadById(idCalendario)
                .orElseThrow(() -> new NotFoundException(CalendarioFacturacionPostventa.class, idCalendario));
    }

    private PeriodoFacturacionPostventa obtenerPeriodoUno(CalendarioFacturacionPostventa calendario) {
        return periodoRepository.findByCalendarioFacturacionPostventaIdAndNumeroPeriodo(
                        calendario.getId(),
                        NUMERO_PERIODO_INICIAL
                )
                .orElseThrow(() -> new BadRequestException("El calendario no tiene periodo 1 para recalcular"));
    }

    private void validarMesCorteBase(CorregirCorteFacturacionRequest request) {
        if (request.getMesCorteBase() == null || request.getNumeroCorteBase() == null) {
            return;
        }
        if (request.getMesCorteBase().getDayOfMonth() != 1) {
            throw new BadRequestException("mesCorteBase debe ser el primer dia del mes");
        }
    }

    private void validarProveedorWin(CalendarioFacturacionPostventa calendario) {
        if (calendario.getTipoReglaProveedor() != TipoReglaFacturacion.WIN) {
            throw new BadRequestException("La correccion de corte solo esta habilitada para WIN");
        }
    }

    private void validarLeadEnPostventa(CalendarioFacturacionPostventa calendario) {
        Lead lead = calendario.getLead();
        if (lead == null || lead.getEtapa() != Etapa.POSTVENTA) {
            throw new BadRequestException("El lead debe estar en POSTVENTA para corregir el corte");
        }
    }

    private void validarPeriodoUno(PeriodoFacturacionPostventa periodo) {
        if (periodo.getNumeroPeriodo() == null || periodo.getNumeroPeriodo() != NUMERO_PERIODO_INICIAL) {
            throw new BadRequestException("Solo se puede corregir el corte durante el periodo 1");
        }
    }

    private void validarCorteNoCorregido(CalendarioFacturacionPostventa calendario) {
        if (Boolean.TRUE.equals(calendario.getCorteCorregido())) {
            throw new BadRequestException("El corte ya fue corregido previamente");
        }
    }

    private void validarNoExistePagoRegistrado(PeriodoFacturacionPostventa periodo) {
        if (periodo.getId() != null && pagoRepository.existsByPeriodoFacturacionPostventaId(periodo.getId())) {
            throw new BadRequestException("No se puede corregir el corte porque el periodo ya tiene pagos registrados");
        }
    }

    private void validarPeriodoNoCerrado(PeriodoFacturacionPostventa periodo) {
        if (periodo.getEstado() == EstadoPeriodoFacturacionPostventa.PAGO_CONFIRMADO
                || periodo.getEstado() == EstadoPeriodoFacturacionPostventa.VENCIDO
                || periodo.getEstado() == EstadoPeriodoFacturacionPostventa.EN_COBRANZA
                || periodo.getEstado() == EstadoPeriodoFacturacionPostventa.BAJA
                || periodo.getEstado() == EstadoPeriodoFacturacionPostventa.ANULADO) {
            throw new BadRequestException("No se puede corregir el corte porque el periodo ya esta cerrado");
        }
    }

    private void validarCorteSiguientePermitido(
            CalendarioFacturacionPostventa calendario,
            CorregirCorteFacturacionRequest request
    ) {
        CorteOperativo actual = resolverCorteActual(calendario);
        CorteOperativo solicitado = new CorteOperativo(request.getMesCorteBase(), request.getNumeroCorteBase());
        if (!solicitado.esSiguienteDe(actual)) {
            throw new BadRequestException("Solo se permite corregir al corte inmediatamente siguiente");
        }
    }

    private CorteOperativo resolverCorteActual(CalendarioFacturacionPostventa calendario) {
        if (calendario.getMesCorteBase() != null && calendario.getNumeroCorteBase() != null) {
            return new CorteOperativo(calendario.getMesCorteBase(), calendario.getNumeroCorteBase());
        }
        if (calendario.getFechaInstalacion() == null) {
            throw new BadRequestException("El calendario no tiene fechaInstalacion para resolver el corte actual");
        }
        boolean corteUno = calendario.getFechaInstalacion().getDayOfMonth() <= 22;
        return new CorteOperativo(
                calendario.getFechaInstalacion().withDayOfMonth(1),
                corteUno ? CORTE_WIN_PRIMERO : CORTE_WIN_SEGUNDO
        );
    }

    private void aplicarCorreccionCorte(
            CalendarioFacturacionPostventa calendario,
            CorregirCorteFacturacionRequest request
    ) {
        calendario.setMesCorteBase(request.getMesCorteBase());
        calendario.setNumeroCorteBase(request.getNumeroCorteBase());
        calendario.setBloqueFacturacion(request.getNumeroCorteBase() == CORTE_WIN_SEGUNDO
                ? BloqueFacturacion.MES_SIGUIENTE
                : BloqueFacturacion.MISMO_MES);
        calendario.setCorteCorregido(true);
        calendario.setFechaCorreccionCorte(Instant.now());
    }

    private PeriodoFacturacionPostventa recalcularPeriodoUno(
            CalendarioFacturacionPostventa calendario,
            PeriodoFacturacionPostventa periodoActual
    ) {
        CalculadoraFacturacionPostventa calculadora = calculadoraResolver.resolver(calendario.getProveedorSnapshot());
        PeriodoFacturacionPostventa recalculado = calculadora.crearPeriodo(calendario, NUMERO_PERIODO_INICIAL);

        periodoActual.setFechaInicioPeriodo(recalculado.getFechaInicioPeriodo());
        periodoActual.setFechaFinPeriodo(recalculado.getFechaFinPeriodo());
        periodoActual.setFechaCorteEstimada(recalculado.getFechaCorteEstimada());
        periodoActual.setFechaEmisionEstimada(recalculado.getFechaEmisionEstimada());
        periodoActual.setFechaVencimientoEstimado(recalculado.getFechaVencimientoEstimado());
        periodoActual.setMontoEsperado(recalculado.getMontoEsperado());
        periodoActual.setMontoProrrateo(recalculado.getMontoProrrateo());
        return periodoActual;
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
        if (lead == null || lead.getEstadoClientePostventa() == EstadoClientePostventa.BAJA) {
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
        if (lead == null || lead.getEtapa() != Etapa.POSTVENTA
                || lead.getEstadoClientePostventa() == EstadoClientePostventa.BAJA) {
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
        lead.setEstadoClientePostventa(EstadoClientePostventa.ACTIVO);
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
                .mesCorteBase(periodo.getCalendarioFacturacionPostventa() == null
                        ? null
                        : periodo.getCalendarioFacturacionPostventa().getMesCorteBase())
                .numeroCorteBase(periodo.getCalendarioFacturacionPostventa() == null
                        ? null
                        : periodo.getCalendarioFacturacionPostventa().getNumeroCorteBase())
                .corteCorregido(periodo.getCalendarioFacturacionPostventa() == null
                        ? null
                        : periodo.getCalendarioFacturacionPostventa().getCorteCorregido())
                .fechaCorreccionCorte(periodo.getCalendarioFacturacionPostventa() == null
                        ? null
                        : periodo.getCalendarioFacturacionPostventa().getFechaCorreccionCorte())
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

    private CalendarioFacturacionPostventaResponse toCalendarioResponse(CalendarioFacturacionPostventa calendario) {
        return CalendarioFacturacionPostventaResponse.builder()
                .id(calendario.getId())
                .idLead(calendario.getLead() == null ? null : calendario.getLead().getId())
                .fechaInstalacion(calendario.getFechaInstalacion())
                .proveedorSnapshot(calendario.getProveedorSnapshot())
                .planSnapshot(calendario.getPlanSnapshot())
                .mesesPermanenciaSnapshot(calendario.getMesesPermanenciaSnapshot())
                .montoPlanSnapshot(calendario.getMontoPlanSnapshot())
                .tipoReglaProveedor(calendario.getTipoReglaProveedor())
                .diaCorte(calendario.getDiaCorte())
                .diaEmisionEstimado(calendario.getDiaEmisionEstimado())
                .diaVencimiento(calendario.getDiaVencimiento())
                .mesCorteBase(calendario.getMesCorteBase())
                .numeroCorteBase(calendario.getNumeroCorteBase())
                .bloqueFacturacion(calendario.getBloqueFacturacion())
                .requiereProrrateoInicial(calendario.getRequiereProrrateoInicial())
                .activo(calendario.getActivo())
                .corteCorregido(calendario.getCorteCorregido())
                .fechaCorreccionCorte(calendario.getFechaCorreccionCorte())
                .createdAt(calendario.getCreatedAt())
                .updatedAt(calendario.getUpdatedAt())
                .build();
    }

    private record CorteOperativo(LocalDate mesCorteBase, Integer numeroCorteBase) {

        private boolean esSiguienteDe(CorteOperativo actual) {
            return orden() == actual.orden() + 1;
        }

        private long orden() {
            return ((long) mesCorteBase.getYear() * 12 + mesCorteBase.getMonthValue()) * 2
                    + numeroCorteBase;
        }
    }
}
