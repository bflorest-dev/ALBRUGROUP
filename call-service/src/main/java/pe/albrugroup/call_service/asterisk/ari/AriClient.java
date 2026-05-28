package pe.albrugroup.call_service.asterisk.ari;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import pe.albrugroup.call_service.config.AsteriskProperties;

import java.util.HashMap;
import java.util.Map;

/**
 * Cliente REST de ARI. Envuelve las operaciones que call-service usa con frecuencia:
 * originate de canales, hangup, creacion de bridges, grabacion y reproduccion.
 *
 * Documentacion: https://docs.asterisk.org/Asterisk_22_Documentation/API_Documentation/Asterisk_REST_Interface/
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class AriClient {

    private final WebClient ariWebClient;
    private final AsteriskProperties props;

    // ---------------------------------------------------------------------
    // CANALES
    // ---------------------------------------------------------------------

    /**
     * Origina una llamada saliente. POST /channels.
     * El canal cae en el dialplan (context/extension/priority) o en Stasis (app).
     *
     * @param endpoint        ej. "PJSIP/1001" o "PJSIP/9999"
     * @param callerId        Caller ID que ve el destino
     * @param context         contexto del dialplan donde caera
     * @param extension       extension del dialplan
     * @param priority        prioridad
     * @param channelVars     variables de canal a inyectar (LEAD_ID, CAMPANA_ID, ...)
     * @return Map con la respuesta JSON de Asterisk (incluye uniqueid, name, state)
     */
    public Map<String, Object> originate(String endpoint,
                                         String callerId,
                                         String context,
                                         String extension,
                                         int priority,
                                         Map<String, String> channelVars) {
        Map<String, Object> body = new HashMap<>();
        body.put("endpoint", endpoint);
        body.put("callerId", callerId);
        body.put("context", context);
        body.put("extension", extension);
        body.put("priority", priority);
        body.put("timeout", 30);
        if (channelVars != null && !channelVars.isEmpty()) {
            body.put("variables", channelVars);
        }

        log.info("ARI originate -> endpoint={}, context={}, ext={}", endpoint, context, extension);

        return ariWebClient.post()
                .uri("/channels")
                .bodyValue(body)
                .retrieve()
                .bodyToMono(Map.class)
                .map(m -> (Map<String, Object>) m)
                .block();
    }

    /** Cuelga un canal por ID. */
    public void hangup(String channelId) {
        ariWebClient.delete()
                .uri(uriBuilder -> uriBuilder.path("/channels/{id}").build(channelId))
                .retrieve()
                .toBodilessEntity()
                .block();
    }

    /** Obtiene el valor de una variable de canal. */
    public String getChannelVar(String channelId, String varName) {
        Map<String, Object> resp = ariWebClient.get()
                .uri(uriBuilder -> uriBuilder
                        .path("/channels/{id}/variable")
                        .queryParam("variable", varName)
                        .build(channelId))
                .retrieve()
                .bodyToMono(Map.class)
                .map(m -> (Map<String, Object>) m)
                .onErrorReturn(Map.of())
                .block();
        return resp != null ? (String) resp.get("value") : null;
    }

    // ---------------------------------------------------------------------
    // BRIDGES
    // ---------------------------------------------------------------------

    public Map<String, Object> createBridge(String type) {
        Map<String, Object> body = new HashMap<>();
        body.put("type", type); // "mixing" para llamadas normales
        return ariWebClient.post()
                .uri("/bridges")
                .bodyValue(body)
                .retrieve()
                .bodyToMono(Map.class)
                .map(m -> (Map<String, Object>) m)
                .block();
    }

    public void addChannelToBridge(String bridgeId, String channelId) {
        ariWebClient.post()
                .uri(uriBuilder -> uriBuilder
                        .path("/bridges/{bridgeId}/addChannel")
                        .queryParam("channel", channelId)
                        .build(bridgeId))
                .retrieve()
                .toBodilessEntity()
                .block();
    }

    // ---------------------------------------------------------------------
    // GRABACION
    // ---------------------------------------------------------------------

    public Map<String, Object> startRecording(String channelId, String name) {
        Map<String, Object> body = new HashMap<>();
        body.put("name", name);
        body.put("format", props.getRecording().getFormat());
        body.put("ifExists", "overwrite");
        body.put("beep", false);

        return ariWebClient.post()
                .uri(uriBuilder -> uriBuilder.path("/channels/{id}/record").build(channelId))
                .bodyValue(body)
                .retrieve()
                .bodyToMono(Map.class)
                .map(m -> (Map<String, Object>) m)
                .block();
    }

    public void stopRecording(String recordingName) {
        ariWebClient.delete()
                .uri(uriBuilder -> uriBuilder
                        .path("/recordings/live/{name}")
                        .build(recordingName))
                .retrieve()
                .toBodilessEntity()
                .block();
    }

    // ---------------------------------------------------------------------
    // PLAYBACK (anuncios)
    // ---------------------------------------------------------------------

    public void play(String channelId, String media) {
        Map<String, Object> body = new HashMap<>();
        body.put("media", media); // ej. "sound:hello-world"
        ariWebClient.post()
                .uri(uriBuilder -> uriBuilder.path("/channels/{id}/play").build(channelId))
                .bodyValue(body)
                .retrieve()
                .toBodilessEntity()
                .block();
    }
}
