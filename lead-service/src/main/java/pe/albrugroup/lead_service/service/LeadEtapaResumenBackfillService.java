package pe.albrugroup.lead_service.service;

import jakarta.annotation.PreDestroy;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionTemplate;
import pe.albrugroup.lead_service.configuration.OperationalDateTime;
import pe.albrugroup.lead_service.entity.Evento;
import pe.albrugroup.lead_service.entity.Subtipificacion;
import pe.albrugroup.lead_service.entity.Tipificacion;
import pe.albrugroup.lead_service.entity.enums.Accion;
import pe.albrugroup.lead_service.entity.enums.ComportamientoTipificacion;
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
 * El mérito por etapa se reconstruye desde los propios eventos y los comportamientos configurados en
 * la matriz de subtipificaciones. El resumen es la única fuente de verdad (el Lead ya no guarda la
 * atribución histórica).
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
    private volatile int fallidos = 0;
    private volatile String ultimoError;
    private volatile Instant iniciadoEn;
    private volatile Instant finalizadoEn;

    /** Arranca el backfill de TODOS los leads en segundo plano. Si ya corre, devuelve el estado actual. */
    public BackfillEstadoResponse iniciarBackfillTodos() {
        if (!enEjecucion.compareAndSet(false, true)) {
            return estadoActual();
        }
        procesados = 0;
        total = 0;
        fallidos = 0;
        ultimoError = null;
        finalizadoEn = null;
        iniciadoEn = OperationalDateTime.now();
        executor.submit(this::ejecutarBackfillCompleto);
        return estadoActual();
    }

    /** Estado del backfill en curso o del último ejecutado (para el botón del panel ADMIN). */
    public BackfillEstadoResponse estadoActual() {
        return new BackfillEstadoResponse(enEjecucion.get(), procesados, total, fallidos, ultimoError, iniciadoEn, finalizadoEn);
    }

    private void ejecutarBackfillCompleto() {
        try {
            Catalogo catalogo = cargarCatalogo();
            List<Object[]> leads = leadRepository.findAllLeadIdsAndEquipos();
            total = leads.size();
            for (Object[] lead : leads) {
                Long idLead = (Long) lead[0];
                Long idEquipo = (Long) lead[1];
                try {
                    ejecutarEnTransaccionNueva(() -> backfillLead(idLead, idEquipo, catalogo));
                } catch (Exception e) {
                    fallidos++;
                    ultimoError = "Lead " + idLead + ": " + e.getMessage();
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
        Long idEquipo = leadRepository.findById(idLead)
                .map(lead -> lead.getIdEquipo())
                .orElseThrow(() -> new IllegalArgumentException("Lead no encontrado"));
        ejecutarEnTransaccionNueva(() -> backfillLead(idLead, idEquipo, catalogo));
    }

    /** Reconstruye todos los leads que coinciden con el numero visible, usando su equipo real. */
    public void backfillPorNumeroLead(String lead) {
        if (lead == null || lead.isBlank()) {
            throw new IllegalArgumentException("Debes indicar el numero de lead");
        }
        String normalizado = lead.replaceAll("\\s+", "");
        List<Object[]> leads = leadRepository.findLeadIdsAndEquiposByLead(normalizado);
        if (leads.isEmpty()) {
            throw new IllegalArgumentException("Lead no encontrado");
        }
        Catalogo catalogo = cargarCatalogo();
        for (Object[] row : leads) {
            Long idLead = (Long) row[0];
            Long idEquipo = (Long) row[1];
            ejecutarEnTransaccionNueva(() -> backfillLead(idLead, idEquipo, catalogo));
        }
    }

    @PreDestroy
    void cerrar() {
        executor.shutdownNow();
    }

    private void backfillLead(Long idLead, Long idEquipo, Catalogo catalogo) {
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
                Integer orden = catalogo.orden(idEquipo, etapa, evento.getTipificacion());
                resumenService.registrarTipificacion(
                        idLead, etapa, evento.getTipificacion(), evento.getSubtipificacion(),
                        orden, evento.getIdActor(), evento.getNombreActor(), evento.getCreatedAt());

                Etapa destino = catalogo.etapaCambio(idEquipo, etapa, evento.getTipificacion(), evento.getSubtipificacion());
                aplicarComportamientosMerito(
                        idLead,
                        etapa,
                        evento.getIdActor(),
                        evento.getNombreActor(),
                        evento.getCreatedAt(),
                        catalogo.comportamientos(idEquipo, etapa, evento.getTipificacion(), evento.getSubtipificacion()));

                if (destino != null && destino != etapa) {
                    resumenService.registrarSalidaEtapa(idLead, etapa, evento.getCreatedAt());
                    resumenService.registrarEntradaEtapa(idLead, destino, evento.getCreatedAt());
                }
            }
        }
    }

    private void aplicarComportamientosMerito(
            Long idLead,
            Etapa etapa,
            Long idAsesor,
            String nombreAsesor,
            Instant at,
            Set<ComportamientoTipificacion> comportamientos
    ) {
        Set<ComportamientoTipificacion> valores = comportamientos == null ? Set.of() : comportamientos;
        // El mérito nunca se borra (ni al reconstruir por backfill): un re-backfill preserva asesor/fecha de
        // mérito. Los comportamientos ANULA_* quedan sin efecto; la coherencia se resuelve en el read-side.
        if (valores.contains(ComportamientoTipificacion.ASIGNA_ASESOR_MERITO)) {
            resumenService.asignarAsesorMerito(idLead, etapa, idAsesor, nombreAsesor, at);
        }
        if (valores.contains(ComportamientoTipificacion.ASIGNA_FECHA_MERITO)) {
            resumenService.asignarFechaMerito(idLead, etapa, at);
        }
    }

    private void ejecutarEnTransaccionNueva(Runnable accion) {
        TransactionTemplate tx = new TransactionTemplate(transactionTemplate.getTransactionManager());
        tx.setPropagationBehavior(TransactionTemplate.PROPAGATION_REQUIRES_NEW);
        tx.executeWithoutResult(status -> accion.run());
    }

    private Catalogo cargarCatalogo() {
        Map<String, Integer> ordenPorTipificacion = new HashMap<>();
        for (Tipificacion tipificacion : tipificacionRepository.findAll()) {
            if (tipificacion.getIdEquipo() != null && tipificacion.getEtapa() != null && tipificacion.getCodigo() != null) {
                ordenPorTipificacion.putIfAbsent(
                        claveTipificacion(tipificacion.getIdEquipo(), tipificacion.getEtapa(), tipificacion.getCodigo()),
                        tipificacion.getOrden());
            }
        }

        Map<String, Etapa> etapaCambioPorSubtipificacion = new HashMap<>();
        Map<String, Set<ComportamientoTipificacion>> comportamientosPorSubtipificacion = new HashMap<>();
        for (Subtipificacion subtipificacion : subtipificacionRepository.listarParaBackfillResumenEtapa()) {
            Tipificacion tipificacion = subtipificacion.getTipificacion();
            if (tipificacion == null) {
                continue;
            }
            Long idEquipo = tipificacion.getIdEquipo();
            Etapa etapa = tipificacion.getEtapa();
            String codigoTip = tipificacion.getCodigo();
            String codigoSub = subtipificacion.getCodigo();
            if (idEquipo != null && etapa != null && codigoTip != null && codigoSub != null) {
                String clave = claveSubtipificacion(idEquipo, etapa, codigoTip, codigoSub);
                etapaCambioPorSubtipificacion.putIfAbsent(clave, subtipificacion.getEtapaCambio());
                Set<ComportamientoTipificacion> comportamientos = subtipificacion.getComportamientos() == null
                        ? Set.of()
                        : Set.copyOf(subtipificacion.getComportamientos());
                comportamientosPorSubtipificacion.putIfAbsent(clave, comportamientos);
            }
        }

        return new Catalogo(
                ordenPorTipificacion, etapaCambioPorSubtipificacion, comportamientosPorSubtipificacion);
    }

    private static String claveTipificacion(Long idEquipo, Etapa etapa, String codigoTipificacion) {
        return idEquipo + "|" + etapa.name() + "|" + codigoTipificacion;
    }

    private static String claveSubtipificacion(Long idEquipo, Etapa etapa, String codigoTipificacion, String codigoSubtipificacion) {
        return idEquipo + "|" + etapa.name() + "|" + codigoTipificacion + "|" + codigoSubtipificacion;
    }

    /** Catálogo plano en memoria: orden de la tipificación, etapa de cambio y estado postventa de cambio. */
    private record Catalogo(
            Map<String, Integer> ordenPorTipificacion,
            Map<String, Etapa> etapaCambioPorSubtipificacion,
            Map<String, Set<ComportamientoTipificacion>> comportamientosPorSubtipificacion) {
        Integer orden(Long idEquipo, Etapa etapa, String codigoTipificacion) {
            if (idEquipo == null || etapa == null || codigoTipificacion == null) {
                return null;
            }
            return ordenPorTipificacion.get(claveTipificacion(idEquipo, etapa, codigoTipificacion));
        }

        Etapa etapaCambio(Long idEquipo, Etapa etapa, String codigoTipificacion, String codigoSubtipificacion) {
            if (idEquipo == null || etapa == null || codigoTipificacion == null || codigoSubtipificacion == null) {
                return null;
            }
            return etapaCambioPorSubtipificacion.get(claveSubtipificacion(idEquipo, etapa, codigoTipificacion, codigoSubtipificacion));
        }

        Set<ComportamientoTipificacion> comportamientos(Long idEquipo, Etapa etapa, String codigoTipificacion, String codigoSubtipificacion) {
            if (idEquipo == null || etapa == null || codigoTipificacion == null || codigoSubtipificacion == null) {
                return Set.of();
            }
            return comportamientosPorSubtipificacion.getOrDefault(
                    claveSubtipificacion(idEquipo, etapa, codigoTipificacion, codigoSubtipificacion),
                    Set.of());
        }

    }
}
