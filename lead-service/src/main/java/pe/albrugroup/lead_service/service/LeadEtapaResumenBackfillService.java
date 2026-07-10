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
import pe.albrugroup.lead_service.entity.enums.EstadoPostventa;
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
 * El mérito por etapa se reconstruye desde los propios eventos (el actor que concreta la etapa),
 * aplicando las mismas condiciones que los hooks en vivo de {@link LeadService}: PREVENTA al avanzar
 * a VENTA, VENTA al tipificar GRABADO, POSTVENTA al avanzar a COBRANZA y COBRANZA al llegar a un
 * estado final. El resumen es la única fuente de verdad (el Lead ya no guarda la atribución histórica).
 * Idempotente y re-ejecutable: borra las filas del lead antes de reconstruirlas. Cada lead va en su
 * propia transacción para aislar fallos y no mantener una transacción gigante.
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
    // Código de la tipificación de VENTA que atribuye el mérito (mismo criterio que LeadService).
    private static final String TIPIFICACION_GRABADO = "GRABADO";
    private static final Set<EstadoPostventa> ESTADOS_POSTVENTA_FINALES =
            EnumSet.of(EstadoPostventa.EFECTIVO, EstadoPostventa.NO_EFECTIVO, EstadoPostventa.BAJA_CONFIRMADA);

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
        boolean preventaIniciada = false;

        for (Evento evento : eventos) {
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
                EstadoPostventa estadoPostventaCambio =
                        catalogo.estadoPostventaCambio(etapa, evento.getTipificacion(), evento.getSubtipificacion());

                // Mérito por etapa: mismas condiciones que los hooks en vivo (LeadService), pero
                // reconstruidas desde el evento (el actor que concretó la etapa).
                if (esMeritoEvento(etapa, destino, evento.getTipificacion(), estadoPostventaCambio)) {
                    resumenService.registrarMerito(
                            idLead, etapa, evento.getIdActor(), evento.getNombreActor(), evento.getCreatedAt());
                }

                if (destino != null && destino != etapa) {
                    resumenService.registrarSalidaEtapa(idLead, etapa, evento.getCreatedAt());
                    resumenService.registrarEntradaEtapa(idLead, destino, evento.getCreatedAt());
                }
            }
        }
    }

    /** ¿Esta tipificación concreta la etapa (le da el mérito)? Espejo de las condiciones de LeadService. */
    private boolean esMeritoEvento(Etapa etapa, Etapa destino, String codigoTipificacion, EstadoPostventa estadoPostventaCambio) {
        return switch (etapa) {
            case PREVENTA -> destino == Etapa.VENTA;
            case VENTA -> TIPIFICACION_GRABADO.equals(codigoTipificacion);
            case POSTVENTA -> destino == Etapa.COBRANZA;
            case COBRANZA -> ESTADOS_POSTVENTA_FINALES.contains(estadoPostventaCambio);
        };
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
        Map<String, EstadoPostventa> estadoPostventaCambioPorSubtipificacion = new HashMap<>();
        for (Object[] fila : subtipificacionRepository.listarCambiosEtapa()) {
            Etapa etapa = (Etapa) fila[0];
            String codigoTip = (String) fila[1];
            String codigoSub = (String) fila[2];
            Etapa etapaCambio = (Etapa) fila[3];
            EstadoPostventa estadoPostventaCambio = (EstadoPostventa) fila[4];
            if (etapa != null && codigoTip != null && codigoSub != null) {
                String clave = claveSubtipificacion(etapa, codigoTip, codigoSub);
                etapaCambioPorSubtipificacion.putIfAbsent(clave, etapaCambio);
                if (estadoPostventaCambio != null) {
                    estadoPostventaCambioPorSubtipificacion.putIfAbsent(clave, estadoPostventaCambio);
                }
            }
        }

        return new Catalogo(
                ordenPorTipificacion, etapaCambioPorSubtipificacion, estadoPostventaCambioPorSubtipificacion);
    }

    private static String claveTipificacion(Etapa etapa, String codigoTipificacion) {
        return etapa.name() + "|" + codigoTipificacion;
    }

    private static String claveSubtipificacion(Etapa etapa, String codigoTipificacion, String codigoSubtipificacion) {
        return etapa.name() + "|" + codigoTipificacion + "|" + codigoSubtipificacion;
    }

    /** Catálogo plano en memoria: orden de la tipificación, etapa de cambio y estado postventa de cambio. */
    private record Catalogo(
            Map<String, Integer> ordenPorTipificacion,
            Map<String, Etapa> etapaCambioPorSubtipificacion,
            Map<String, EstadoPostventa> estadoPostventaCambioPorSubtipificacion) {
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

        EstadoPostventa estadoPostventaCambio(Etapa etapa, String codigoTipificacion, String codigoSubtipificacion) {
            if (etapa == null || codigoTipificacion == null || codigoSubtipificacion == null) {
                return null;
            }
            return estadoPostventaCambioPorSubtipificacion.get(
                    claveSubtipificacion(etapa, codigoTipificacion, codigoSubtipificacion));
        }
    }
}
