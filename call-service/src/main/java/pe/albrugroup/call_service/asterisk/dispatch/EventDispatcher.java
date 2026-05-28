package pe.albrugroup.call_service.asterisk.dispatch;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.asteriskjava.manager.event.*;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import pe.albrugroup.call_service.entity.Call;
import pe.albrugroup.call_service.entity.CallEvent;
import pe.albrugroup.call_service.entity.enums.CallDirection;
import pe.albrugroup.call_service.entity.enums.CallStatus;
import pe.albrugroup.call_service.entity.enums.EventoLlamada;
import pe.albrugroup.call_service.entity.enums.HangupBy;
import pe.albrugroup.call_service.repository.CallEventRepository;
import pe.albrugroup.call_service.repository.CallRepository;

import java.time.Duration;
import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

/**
 * Traduce cada evento AMI / ARI a estado en BD.
 *
 * Estrategia:
 *  - Llamadas (Call): UPSERT por uniqueId. Cada evento que aporta info (ring, answer,
 *    bridge, hangup) actualiza los timestamps correspondientes. Idempotente: si el
 *    mismo evento llega dos veces, los campos quedan igual.
 *  - Eventos (CallEvent): append-only. Siempre se insertan, son el log de auditoria.
 *  - KPIs (waitSeconds, talkSeconds, tmoSeconds): se calculan en hangup, con los
 *    timestamps que sobrevivieron al ciclo. Si falta alguno, queda null (no rompe).
 *
 * Thread-safety: los eventos llegan en threads del listener AMI / WS. Las inserciones
 * de Call usan saveAndFlush + catch de DataIntegrityViolation para resolver carreras
 * sobre la columna unique uniqueId.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class EventDispatcher {

    private final CallRepository callRepo;
    private final CallEventRepository eventRepo;

    // =========================================================================
    // AMI
    // =========================================================================

    @Transactional
    public void onAmiEvent(ManagerEvent event) {
        try {
            dispatchAmi(event);
        } catch (Exception ex) {
            log.error("Error procesando AMI {}: {}", event.getClass().getSimpleName(), ex.getMessage(), ex);
        }
    }

    private void dispatchAmi(ManagerEvent event) {
        // ---------------- creacion / canal nuevo ----------------
        if (event instanceof NewChannelEvent e) {
            Call c = findOrCreateCall(e.getUniqueId(), null, inferDirectionFromContext(e.getContext()));
            if (c.getOriginatedAt() == null) c.setOriginatedAt(Instant.now());
            callRepo.save(c);
            appendEvent(c, EventoLlamada.RING, e.getChannel(), toPayload(e), now());
            log.debug("AMI NewChannel uniqueId={} channel={}", e.getUniqueId(), e.getChannel());
            return;
        }

        // ---------------- ring start (dial) ----------------
        if (event instanceof DialBeginEvent e) {
            Call c = findOrCreateCall(e.getUniqueId(), e.getLinkedId(), CallDirection.OUTBOUND);
            if (c.getRingStartAt() == null) c.setRingStartAt(now());
            c.setEstado(CallStatus.RINGING);
            callRepo.save(c);
            appendEvent(c, EventoLlamada.RING, e.getChannel(), toPayload(e), now());
            return;
        }

        // ---------------- answer / dial end ----------------
        if (event instanceof DialEndEvent e) {
            Optional<Call> ocall = callRepo.findByUniqueId(e.getUniqueId());
            if (ocall.isEmpty()) return;
            Call c = ocall.get();
            String status = safeUpper(e.getDialStatus());
            if ("ANSWER".equals(status)) {
                if (c.getAnsweredAt() == null) c.setAnsweredAt(now());
                c.setEstado(CallStatus.ANSWERED);
                appendEvent(c, EventoLlamada.ANSWER, e.getChannel(), toPayload(e), now());
            } else if ("BUSY".equals(status)) {
                c.setEstado(CallStatus.BUSY);
            } else if ("NOANSWER".equals(status) || "CANCEL".equals(status)) {
                c.setEstado(CallStatus.NO_ANSWER);
            } else if ("CONGESTION".equals(status) || "CHANUNAVAIL".equals(status)) {
                c.setEstado(CallStatus.CONGESTION);
            }
            callRepo.save(c);
            return;
        }

        // ---------------- cola: entra ----------------
        if (event instanceof JoinEvent e) {
            Call c = findOrCreateCall(e.getUniqueId(), null, CallDirection.OUTBOUND);
            c.setQueueName(e.getQueue());
            if (c.getRingStartAt() == null) c.setRingStartAt(now());
            callRepo.save(c);
            appendEvent(c, EventoLlamada.QUEUE_JOIN, e.getChannel(), toPayload(e), now());
            log.info("AMI Join queue={} channel={} pos={}", e.getQueue(), e.getChannel(), e.getPosition());
            return;
        }

        if (event instanceof LeaveEvent e) {
            Optional<Call> ocall = callRepo.findByUniqueId(e.getUniqueId());
            ocall.ifPresent(c -> appendEvent(c, EventoLlamada.QUEUE_LEAVE, e.getChannel(), toPayload(e), now()));
            return;
        }

        // ---------------- cola: cliente abandonó antes de ser atendido ----------------
        if (event instanceof QueueCallerAbandonEvent e) {
            Optional<Call> ocall = callRepo.findByUniqueId(e.getUniqueId());
            if (ocall.isEmpty()) return;
            Call c = ocall.get();
            c.setEstado(CallStatus.ABANDONED);
            if (c.getEndedAt() == null) c.setEndedAt(now());
            c.setWaitSeconds(safeInt(e.getHoldTime()));
            callRepo.save(c);
            appendEvent(c, EventoLlamada.QUEUE_ABANDON, null, toPayload(e), now());
            log.info("AMI QueueAbandon queue={} wait={}s", e.getQueue(), e.getHoldTime());
            return;
        }

        // ---------------- agente toma la llamada ----------------
        // OJO: asterisk-java 3.x expone 'interface' (ej. PJSIP/1001) en getInterface(),
        // no en getMember() (que devuelve null). Lo usamos para llenar extensionAsesor.
        // Ademas, AgentConnect trae DOS uniqueid: caller (getUniqueId) y agent leg
        // (getDestUniqueId). Una llamada en cola produce dos filas Call en BD (una por
        // canal SIP); actualizamos AMBAS para que classifyHangup funcione despues sin
        // importar por cual canal llega el HangupEvent.
        if (event instanceof AgentConnectEvent e) {
            String iface = e.getInterface();                                  // PJSIP/1001
            String linkedId = e.getLinkedId() != null ? e.getLinkedId() : e.getUniqueId();

            callRepo.findByUniqueId(e.getUniqueId()).ifPresent(c -> {         // caller leg
                c.setBridgedAt(now());
                c.setAgentTalkStartAt(now());
                c.setEstado(CallStatus.BRIDGED);
                if (iface != null) c.setExtensionAsesor(iface);
                if (c.getLinkedId() == null) c.setLinkedId(linkedId);
                if (c.getWaitSeconds() == null) c.setWaitSeconds(safeInt(e.getHoldTime()));
                callRepo.save(c);
                appendEvent(c, EventoLlamada.AGENT_CONNECT, iface, toPayload(e), now());
            });

            if (e.getDestUniqueId() != null) {                                // agent leg
                callRepo.findByUniqueId(e.getDestUniqueId()).ifPresent(c -> {
                    if (iface != null) c.setExtensionAsesor(iface);
                    if (c.getLinkedId() == null) c.setLinkedId(linkedId);
                    callRepo.save(c);
                });
            }

            log.info("AMI AgentConnect caller={} agent={} interface={} hold={}",
                    e.getUniqueId(), e.getDestUniqueId(), iface, e.getHoldTime());
            return;
        }

        if (event instanceof AgentRingNoAnswerEvent e) {
            Optional<Call> ocall = callRepo.findByUniqueId(e.getUniqueId());
            ocall.ifPresent(c -> appendEvent(c, EventoLlamada.AGENT_RING_NO_ANSWER, e.getInterface(), toPayload(e), now()));
            return;
        }

        if (event instanceof AgentCompleteEvent e) {
            Optional<Call> ocall = callRepo.findByUniqueId(e.getUniqueId());
            if (ocall.isEmpty()) return;
            Call c = ocall.get();
            c.setTalkSeconds(safeInt(e.getTalkTime()));
            callRepo.save(c);
            appendEvent(c, EventoLlamada.AGENT_COMPLETE, e.getInterface(), toPayload(e), now());
            return;
        }

        // ---------------- bridge ----------------
        if (event instanceof BridgeEnterEvent e) {
            Optional<Call> ocall = callRepo.findByUniqueId(e.getUniqueId());
            ocall.ifPresent(c -> {
                if (c.getBridgedAt() == null) {
                    c.setBridgedAt(now());
                    c.setEstado(CallStatus.BRIDGED);
                    callRepo.save(c);
                }
                appendEvent(c, EventoLlamada.BRIDGE_ENTER, e.getChannel(), toPayload(e), now());
            });
            return;
        }

        if (event instanceof BridgeLeaveEvent e) {
            Optional<Call> ocall = callRepo.findByUniqueId(e.getUniqueId());
            ocall.ifPresent(c -> appendEvent(c, EventoLlamada.BRIDGE_LEAVE, e.getChannel(), toPayload(e), now()));
            return;
        }

        // ---------------- hangup: evento terminal ----------------
        if (event instanceof HangupEvent e) {
            Optional<Call> ocall = callRepo.findByUniqueId(e.getUniqueId());
            if (ocall.isEmpty()) return;
            Call c = ocall.get();
            if (c.getEndedAt() == null) c.setEndedAt(now());
            c.setHangupCause(e.getCauseTxt() != null ? e.getCause() + " - " + e.getCauseTxt() : String.valueOf(e.getCause()));
            if (c.getLinkedId() == null && e.getLinkedId() != null) c.setLinkedId(e.getLinkedId());

            // Quien colgo. Asterisk emite DOS HangupEvent por llamada (uno por canal
            // SIP); el primero es el originador del BYE, el segundo es la propagacion.
            // Como las dos filas Call comparten linkedId, detectamos la propagacion
            // mirando si la fila hermana ya tiene hangup_by seteado.
            if (c.getHangupBy() == null) {
                HangupBy sibling = findSiblingHangupBy(c.getLinkedId(), c.getId());
                if (sibling != null) {
                    c.setHangupBy(sibling);                                   // propagacion
                } else {
                    HangupBy classified = classifyHangup(c, e.getChannel(), e.getCause());
                    c.setHangupBy(classified);
                    propagateHangupByToSibling(c.getLinkedId(), c.getId(), classified);
                }
            }

            // Estado final si todavia no quedo en uno terminal
            if (c.getEstado() == null
                    || c.getEstado() == CallStatus.ORIGINATING
                    || c.getEstado() == CallStatus.RINGING
                    || c.getEstado() == CallStatus.ANSWERED
                    || c.getEstado() == CallStatus.BRIDGED) {
                if (c.getBridgedAt() != null) {
                    c.setEstado(CallStatus.COMPLETED);
                } else if (c.getAnsweredAt() != null) {
                    c.setEstado(CallStatus.COMPLETED);
                } else {
                    c.setEstado(CallStatus.NO_ANSWER);
                }
            }

            computeKpis(c);
            callRepo.save(c);
            appendEvent(c, EventoLlamada.HANGUP, e.getChannel(), toPayload(e), now());
            log.info("AMI Hangup uniqueId={} estado={} talk={}s tmo={}s hangupBy={} cause={}",
                    e.getUniqueId(), c.getEstado(), c.getTalkSeconds(), c.getTmoSeconds(),
                    c.getHangupBy(), c.getHangupCause());
        }
    }

    // =========================================================================
    // ARI
    // =========================================================================

    @Transactional
    public void onAriEvent(Map<String, Object> event) {
        try {
            dispatchAri(event);
        } catch (Exception ex) {
            log.error("Error procesando ARI: {}", ex.getMessage(), ex);
        }
    }

    @SuppressWarnings("unchecked")
    private void dispatchAri(Map<String, Object> event) {
        String type = (String) event.get("type");
        if (type == null) return;

        Map<String, Object> channel = (Map<String, Object>) event.get("channel");
        String uniqueId = channel != null ? (String) channel.get("id") : null;
        String channelName = channel != null ? (String) channel.get("name") : null;

        switch (type) {
            case "StasisStart" -> {
                if (uniqueId == null) return;
                Call c = findOrCreateCall(uniqueId, null, CallDirection.OUTBOUND);
                callRepo.save(c);
                appendEvent(c, EventoLlamada.ORIGINATE, channelName, event, now());
                log.info("ARI StasisStart channel={} args={}", channelName, event.get("args"));
            }
            case "StasisEnd" -> {
                if (uniqueId == null) return;
                callRepo.findByUniqueId(uniqueId).ifPresent(c ->
                        appendEvent(c, EventoLlamada.QUEUE_LEAVE, channelName, event, now()));
            }
            case "RecordingStarted" -> {
                Map<String, Object> rec = (Map<String, Object>) event.get("recording");
                log.info("ARI RecordingStarted: {}", rec);
                if (uniqueId != null && rec != null) {
                    callRepo.findByUniqueId(uniqueId).ifPresent(c ->
                            appendEvent(c, EventoLlamada.RECORDING_START, channelName, event, now()));
                }
            }
            case "RecordingFinished" -> {
                Map<String, Object> rec = (Map<String, Object>) event.get("recording");
                log.info("ARI RecordingFinished: {}", rec);
                if (uniqueId != null) {
                    callRepo.findByUniqueId(uniqueId).ifPresent(c ->
                            appendEvent(c, EventoLlamada.RECORDING_STOP, channelName, event, now()));
                }
            }
            case "ChannelHangupRequest" -> log.debug("ARI HangupRequest channel={}", channelName);
            case "ChannelStateChange" -> log.trace("ARI ChannelStateChange channel={} state={}",
                    channelName, channel != null ? channel.get("state") : null);
            case "BridgeCreated", "ChannelEnteredBridge", "ChannelLeftBridge" ->
                    log.trace("ARI {}", type);
            default -> log.trace("ARI evento ignorado: {}", type);
        }
    }

    // =========================================================================
    // helpers
    // =========================================================================

    /** UPSERT idempotente sobre uniqueId. Maneja la carrera con catch + re-find. */
    private Call findOrCreateCall(String uniqueId, String linkedId, CallDirection direction) {
        Optional<Call> existing = callRepo.findByUniqueId(uniqueId);
        if (existing.isPresent()) {
            Call c = existing.get();
            if (linkedId != null && c.getLinkedId() == null) c.setLinkedId(linkedId);
            return c;
        }
        Call c = Call.builder()
                .uniqueId(uniqueId)
                .linkedId(linkedId)
                .direction(direction != null ? direction : CallDirection.OUTBOUND)
                .estado(CallStatus.ORIGINATING)
                .originatedAt(Instant.now())
                .build();
        try {
            return callRepo.saveAndFlush(c);
        } catch (DataIntegrityViolationException race) {
            return callRepo.findByUniqueId(uniqueId)
                    .orElseThrow(() -> race);
        }
    }

    private void appendEvent(Call call, EventoLlamada tipo, String channel,
                             Map<String, Object> payload, Instant ocurridoEn) {
        CallEvent ev = CallEvent.builder()
                .call(call)
                .tipoEvento(tipo)
                .channel(channel)
                .payload(payload)
                .ocurridoEn(ocurridoEn)
                .build();
        eventRepo.save(ev);
    }

    /** Calcula los KPI derivados a partir de los timestamps disponibles. */
    private void computeKpis(Call c) {
        if (c.getWaitSeconds() == null && c.getRingStartAt() != null && c.getAnsweredAt() != null) {
            c.setWaitSeconds((int) Duration.between(c.getRingStartAt(), c.getAnsweredAt()).getSeconds());
        }
        if (c.getTalkSeconds() == null && c.getBridgedAt() != null && c.getEndedAt() != null) {
            c.setTalkSeconds((int) Duration.between(c.getBridgedAt(), c.getEndedAt()).getSeconds());
        }
        // TMO = talk + hold + wrapUp. En Fase 1 hold y wrapUp se quedan en null/0.
        int talk = c.getTalkSeconds() != null ? c.getTalkSeconds() : 0;
        int hold = c.getHoldSeconds() != null ? c.getHoldSeconds() : 0;
        int wrap = c.getWrapUpSeconds() != null ? c.getWrapUpSeconds() : 0;
        c.setTmoSeconds(talk + hold + wrap);
    }

    /** Busca el hangupBy ya seteado en la fila hermana (misma llamada, otro canal SIP). */
    private HangupBy findSiblingHangupBy(String linkedId, Long currentId) {
        if (linkedId == null) return null;
        return callRepo.findByLinkedId(linkedId).stream()
                .filter(s -> !s.getId().equals(currentId) && s.getHangupBy() != null)
                .map(Call::getHangupBy)
                .findFirst()
                .orElse(null);
    }

    /** Propaga el hangupBy decidido a la otra fila Call del mismo linkedId (si existe). */
    private void propagateHangupByToSibling(String linkedId, Long currentId, HangupBy value) {
        if (linkedId == null || value == null) return;
        callRepo.findByLinkedId(linkedId).stream()
                .filter(s -> !s.getId().equals(currentId) && s.getHangupBy() == null)
                .forEach(s -> {
                    s.setHangupBy(value);
                    callRepo.save(s);
                });
    }

    /**
     * Clasifica quien colgo a partir del canal del primer HangupEvent y el cause Q.850.
     *
     * Reglas (en orden):
     *  1) Cause code de "no humano" -> SYSTEM (timeout, unreachable, no answer, etc.)
     *  2) El canal pertenece a la extension del asesor -> AGENT
     *  3) Existe extensionAsesor pero el canal NO la matchea -> CLIENT
     *  4) No tenemos extensionAsesor (la llamada nunca llego a un agente) -> CLIENT
     *     (asumimos que el cliente colgo antes de ser atendido; los casos de timeout
     *     ya cayeron en regla 1).
     *  5) Fallback defensivo -> UNKNOWN
     *
     * Codigos Q.850 considerados "sistema":
     *  18  No User Response       (agente no respondio al ring)
     *  19  No Answer From User    (idem)
     *  21  Call Rejected          (el SIP devolvio 603/486 sin intervencion humana)
     *  31  Normal Unspecified     (Asterisk lo emite cuando el dialplan termina solo)
     *  41  Temporary Failure      (perdida de transporte)
     *  44  Channel Unavailable    (interface caida)
     *  102 Recovery on Timer Expiry (session timer)
     *
     * NOTA: 16 (Normal Clearing) es el cause estandar cuando alguien manda BYE; ahi
     * NO podemos decidir por cause y caemos a las reglas 2/3.
     */
    private HangupBy classifyHangup(Call c, String channel, Integer cause) {
        if (cause != null) {
            switch (cause) {
                case 18, 19, 21, 31, 41, 44, 102 -> { return HangupBy.SYSTEM; }
                default -> { /* sigue a la clasificacion por canal */ }
            }
        }
        String asesor = c.getExtensionAsesor();      // ej. "PJSIP/1001"
        if (channel == null) return HangupBy.UNKNOWN;
        if (asesor != null && !asesor.isBlank() && channel.startsWith(asesor + "-")) {
            return HangupBy.AGENT;
        }
        return HangupBy.CLIENT;
    }

    private CallDirection inferDirectionFromContext(String context) {
        if (context == null) return CallDirection.OUTBOUND;
        if (context.startsWith("from-call-service")) return CallDirection.OUTBOUND;
        if (context.startsWith("from-trunk")) return CallDirection.INBOUND;
        if (context.startsWith("internal")) return CallDirection.INTERNAL;
        return CallDirection.OUTBOUND;
    }

    /** Convierte el evento a un Map plano para guardar como JSONB. */
    private Map<String, Object> toPayload(ManagerEvent e) {
        Map<String, Object> m = new HashMap<>();
        m.put("class", e.getClass().getSimpleName());
        // asterisk-java 3.x ya no expone getAttributes(); toString() dump todos los
        // setters/getters del evento, suficiente para auditoria.
        m.put("dump", e.toString());
        return m;
    }

    private static Instant now() { return Instant.now(); }

    private static String safeUpper(String s) { return s == null ? "" : s.toUpperCase(); }

    private static Integer safeInt(Long v) { return v == null ? null : v.intValue(); }
    private static Integer safeInt(Integer v) { return v; }
}
