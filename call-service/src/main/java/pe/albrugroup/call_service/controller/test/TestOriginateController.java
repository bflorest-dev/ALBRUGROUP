package pe.albrugroup.call_service.controller.test;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import pe.albrugroup.call_service.asterisk.ari.AriClient;
import pe.albrugroup.call_service.entity.Call;
import pe.albrugroup.call_service.entity.enums.CallDirection;
import pe.albrugroup.call_service.entity.enums.CallStatus;
import pe.albrugroup.call_service.repository.CallRepository;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

/**
 * Endpoints de prueba para Fase 1.
 * Permiten disparar llamadas manualmente sin necesidad del dialer ni del frontend.
 *
 * NO usar en produccion: estos endpoints estan sin auth y sirven solo para
 * validar la integracion Asterisk <-> call-service.
 */
@RestController
@RequestMapping("/test/calls")
@RequiredArgsConstructor
@Slf4j
public class TestOriginateController {

    private final AriClient ariClient;
    private final CallRepository callRepo;

    /**
     * Origina una llamada hacia una extension interna (1001-1003 o 9999),
     * inyectando LEAD_ID y CAMPANA_ID como variables de canal.
     *
     * Tambien pre-crea la fila Call en estado ORIGINATING con el uniqueid devuelto
     * por Asterisk, para que los eventos AMI/ARI que vengan despues la encuentren.
     */
    @PostMapping("/originate")
    public Map<String, Object> originate(@RequestBody OriginateRequest req) {
        Map<String, String> vars = new HashMap<>();
        if (req.getLeadId() != null) vars.put("LEAD_ID", String.valueOf(req.getLeadId()));
        if (req.getCampanaId() != null) vars.put("CAMPANA_ID", String.valueOf(req.getCampanaId()));

        String context = req.getContext() != null ? req.getContext() : "from-call-service";
        String extension = req.getExtension() != null ? req.getExtension() : "queue";

        Map<String, Object> resp = ariClient.originate(
                req.getEndpoint(),
                req.getCallerId() != null ? req.getCallerId() : "AlbruGroup",
                context,
                extension,
                1,
                vars
        );
        log.info("Originate disparado: {}", resp);

        // Pre-creamos la fila Call con el uniqueid devuelto. ARI devuelve el id del canal
        // (que es el uniqueid). Si la insercion falla por carrera con un evento que ya
        // llego, no pasa nada -- EventDispatcher tambien hace upsert.
        String uniqueId = (String) resp.get("id");
        if (uniqueId != null && callRepo.findByUniqueId(uniqueId).isEmpty()) {
            Call c = Call.builder()
                    .uniqueId(uniqueId)
                    .direction(CallDirection.OUTBOUND)
                    .estado(CallStatus.ORIGINATING)
                    .originatedAt(Instant.now())
                    .idLead(req.getLeadId())
                    .idCampana(req.getCampanaId())
                    .queueName(req.getContext() != null && req.getExtension() != null
                            && "queue".equals(req.getExtension()) ? "cola-ventas" : null)
                    .build();
            try {
                callRepo.save(c);
            } catch (Exception ignored) { /* race: evento ya creo la fila */ }
        }

        return resp;
    }

    @Data
    public static class OriginateRequest {
        /** Ej. PJSIP/9999 */
        @NotBlank
        private String endpoint;
        private String callerId;
        private String context;     // default: from-call-service
        private String extension;   // default: queue
        private Long leadId;
        private Long campanaId;
    }
}
