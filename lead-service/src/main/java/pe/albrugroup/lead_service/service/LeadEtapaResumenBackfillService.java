package pe.albrugroup.lead_service.service;

import jakarta.annotation.PreDestroy;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionTemplate;
import pe.albrugroup.lead_service.configuration.OperationalDateTime;
import pe.albrugroup.lead_service.entity.Evento;
import pe.albrugroup.lead_service.entity.Tipificacion;
import pe.albrugroup.lead_service.entity.enums.Accion;
import pe.albrugroup.lead_service.entity.enums.Etapa;
import pe.albrugroup.lead_service.entity.response.BackfillEstadoResponse;
import pe.albrugroup.lead_service.repository.EventoRepository;
import pe.albrugroup.lead_service.repository.LeadEtapaResumenRepository;
import pe.albrugroup.lead_service.repository.LeadRepository;
import pe.albrugroup.lead_service.repository.SubtipificacionRepository;
import pe.albrugroup.lead_service.repository.TipificacionRepository;

import java.time.Instant;
import java.util.EnumSet;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicBoolean;

/**
 * Backfill histórico de {@link pe.albrugroup.lead_service.entity.LeadEtapaResumen}: reconstruye la
 * metadata por etapa de los leads existentes reproduciendo sus eventos en orden cronológico y
 * reutilizando los mismos métodos de escritura que usan los hooks en vivo ({@link LeadEtapaResumenService}).
 *
 * El mérito por etapa se siembra desde la atribución ya calculada en el Lead
 * (idAsesorPreventa/Venta/Postventa/Cobranza), que es la fuente de verdad actual. Idempotente y
 * re-ejecutable: borra las filas del lead antes de reconstruirlas. Cada lead va en su propia
 * transacción para aislar fallos y no mantener una transacción gigante.
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class LeadEtapaResumenBackfillService {

    private final LeadRepository leadRepository;
    private final EventoRepository eventoRepository;
    private final LeadEtapaResumenRepository resumenRepository;
    private final LeadEtapaResumenService resumenService;
    private final TipificacionRepository tipificacionRepository;
    private final SubtipificacionRepository subtipificacionRepository;
    private final TransactionTemplate transactionTemplate;

    private static final Set<Accion> ACCIONES_REGISTRO = EnumSet.of(Accion.REGISTRO, Accion.NUEVA_OPORTUNIDAD);

    // El backfill completo corre en segundo plano (evita el timeout de Cloudflare/gateway en runs
    // largos) y expone su progreso en memoria. Un solo hilo => nunca hay dos runs en paralelo.
    private final ExecutorService executor = Executors.newSingleThreadExecutor(runnable -> {
        Thread thread = new Thread(runnable, "lead-etapa-resumen-backfill");
        thread.setDaemon(true);
        return thread;
    });
    private final AtomicBoolean enEjecucion = new AtomicBoolean(false);
    private volatile int procesados = 0;
    private volatile int total = 0;
    private volatile Instant iniciadoEn;
    private volatile Instant finalizadoEn;

    /** Arranca el backfill de TODOS los leads en segundo plano. Si ya corre, devuelve el estado actual. */
    public BackfillEstadoResponse iniciarBackfillTodos() {
        if (!enEjecucion.compareAndSet(false, true)) {
            return estadoActual();
        }
        procesados = 0;
        total = 0;
        finalizadoEn = null;
        iniciadoEn = OperationalDateTime.now();
        executor.submit(this::ejecutarBackfillCompleto);
        return estadoActual();
    }

    /** Estado del backfill en curso o del último ejecutado (para el botón del panel ADMIN). */
    public BackfillEstadoResponse estadoActual() {
        return new BackfillEstadoResponse(enEjecucion.get(), procesados, total, iniciadoEn, finalizadoEn);
    }

    private void ejecutarBackfillCompleto() {
        try {
            Catalogo catalogo = cargarCatalogo();
            List<Long> ids = leadRepository.findAllLeadIds();
            total = ids.size();
            for (Long idLead : ids) {
                try {
                    ejecutarEnTransaccionNueva(() -> backfillLead(idLead, catalogo));
                } catch (Exception e) {
                    log.warn("Backfill LeadEtapaResumen fallo para lead {}: {}", idLead, e.getMessage());
                }
                procesados++;
            }
        } catch (Exception e) {
            log.error("Backfill LeadEtapaResumen completo fallo: {}", e.getMessage(), e);
        } finally {
            finalizadoEn = OperationalDateTime.now();
            enEjecucion.set(false);
        }
    }

    /** Reconstruye el resumen de un lead puntual (síncrono, útil para verificar casos concretos). */
    public void backfillUnLead(Long idLead) {
        Catalogo catalogo = cargarCatalogo();
        ejecutarEnTransaccionNueva(() -> backfillLead(idLead, catalogo));
    }

    @PreDestroy
    void cerrar() {
        executor.shutdownNow();
    }

    private void backfillLead(Long idLead, Catalogo catalogo) {
        resumenRepository.deleteByIdLead(idLead);

        List<Evento> eventos = eventoRepository.findAllByIdLeadOrderByCreatedAtAscIdAsc(idLead);
        Map<Long, String> nombrePorActor = new HashMap<>();
        boolean preventaIniciada = false;

        for (Evento evento : eventos) {
            if (evento.getIdActor() != null && evento.getNombreActor() != null) {
                nombrePorActor.putIfAbsent(evento.getIdActor(), evento.getNombreActor());
            }
            Etapa etapa = evento.getEtapa();
            Accion accion = evento.getAccion();
            if (etapa == null || accion == null) {
                continue;
            }

            if (ACCIONES_REGISTRO.contains(accion)) {
                // Solo la primera vez: entrada inicial a la etapa (no re-cuenta re-registros).
                if (!preventaIniciada) {
                    resumenService.registrarEntradaEtapa(idLead, etapa, evento.getCreatedAt());
                    preventaIniciada = true;
                }
            } else if (accion == Accion.ASIGNACION) {
                resumenService.registrarAsignacion(idLead, etapa, evento.getCreatedAt());
            } else if (accion == Accion.TIPIFICACION) {
                Integer orden = catalogo.orden(etapa, evento.getTipificacion());
                resumenService.registrarTipificacion(
                        idLead, etapa, evento.getTipificacion(), evento.getSubtipificacion(),
                        orden, evento.getIdActor(), evento.getNombreActor(), evento.getCreatedAt());

                Etapa destino = catalogo.etapaCambio(etapa, evento.getTipificacion(), evento.getSubtipificacion());
                if (destino != null && destino != etapa) {
                    resumenService.registrarSalidaEtapa(idLead, etapa, evento.getCreatedAt());
                    resumenService.registrarEntradaEtapa(idLead, destino, evento.getCreatedAt());
                }
            }
        }

        // Mérito por etapa desde la atribución del Lead (fuente de verdad actual).
        leadRepository.findById(idLead).ifPresent(lead -> {
            sembrarMerito(idLead, Etapa.PREVENTA, lead.getIdAsesorPreventa(), lead.getFechaPreventa(), nombrePorActor);
            sembrarMerito(idLead, Etapa.VENTA, lead.getIdAsesorVenta(), lead.getFechaVenta(), nombrePorActor);
            sembrarMerito(idLead, Etapa.POSTVENTA, lead.getIdAsesorPostventa(), lead.getFechaPostventa(), nombrePorActor);
            sembrarMerito(idLead, Etapa.COBRANZA, lead.getIdAsesorCobranza(), lead.getFechaCobranza(), nombrePorActor);
        });
    }

    private void sembrarMerito(Long idLead, Etapa etapa, Long idAsesor, Instant fecha, Map<Long, String> nombres) {
        if (idAsesor == null) {
            return;
        }
        resumenService.registrarMerito(
                idLead, etapa, idAsesor, nombres.get(idAsesor),
                fecha != null ? fecha : OperationalDateTime.now());
    }

    private void ejecutarEnTransaccionNueva(Runnable accion) {
        TransactionTemplate tx = new TransactionTemplate(transactionTemplate.getTransactionManager());
        tx.setPropagationBehavior(TransactionTemplate.PROPAGATION_REQUIRES_NEW);
        tx.executeWithoutResult(status -> accion.run());
    }

    private Catalogo cargarCatalogo() {
        Map<String, Integer> ordenPorTipificacion = new HashMap<>();
        for (Tipificacion tipificacion : tipificacionRepository.findAll()) {
            if (tipificacion.getEtapa() != null && tipificacion.getCodigo() != null) {
                ordenPorTipificacion.putIfAbsent(
                        claveTipificacion(tipificacion.getEtapa(), tipificacion.getCodigo()),
                        tipificacion.getOrden());
            }
        }

        Map<String, Etapa> etapaCambioPorSubtipificacion = new HashMap<>();
        for (Object[] fila : subtipificacionRepository.listarCambiosEtapa()) {
            Etapa etapa = (Etapa) fila[0];
            String codigoTip = (String) fila[1];
            String codigoSub = (String) fila[2];
            Etapa etapaCambio = (Etapa) fila[3];
            if (etapa != null && codigoTip != null && codigoSub != null) {
                etapaCambioPorSubtipificacion.putIfAbsent(
                        claveSubtipificacion(etapa, codigoTip, codigoSub), etapaCambio);
            }
        }

        return new Catalogo(ordenPorTipificacion, etapaCambioPorSubtipificacion);
    }

    private static String claveTipificacion(Etapa etapa, String codigoTipificacion) {
        return etapa.name() + "|" + codigoTipificacion;
    }

    private static String claveSubtipificacion(Etapa etapa, String codigoTipificacion, String codigoSubtipificacion) {
        return etapa.name() + "|" + codigoTipificacion + "|" + codigoSubtipificacion;
    }

    /** Catálogo plano en memoria: orden de la tipificación y etapa de cambio de la subtipificación. */
    private record Catalogo(Map<String, Integer> ordenPorTipificacion, Map<String, Etapa> etapaCambioPorSubtipificacion) {
        Integer orden(Etapa etapa, String codigoTipificacion) {
            if (etapa == null || codigoTipificacion == null) {
                return null;
            }
            return ordenPorTipificacion.get(claveTipificacion(etapa, codigoTipificacion));
        }

        Etapa etapaCambio(Etapa etapa, String codigoTipificacion, String codigoSubtipificacion) {
            if (etapa == null || codigoTipificacion == null || codigoSubtipificacion == null) {
                return null;
            }
            return etapaCambioPorSubtipificacion.get(claveSubtipificacion(etapa, codigoTipificacion, codigoSubtipificacion));
        }
    }
}
