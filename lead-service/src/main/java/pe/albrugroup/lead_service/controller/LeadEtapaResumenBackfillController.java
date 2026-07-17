package pe.albrugroup.lead_service.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import pe.albrugroup.lead_service.entity.response.BackfillEstadoResponse;
import pe.albrugroup.lead_service.service.LeadEtapaResumenBackfillService;

/**
 * Backfill admin de LeadEtapaResumen: reconstruye la metadata por etapa de los leads existentes
 * reproduciendo sus eventos. Idempotente y re-ejecutable. Se corre una vez tras desplegar la Fase 1.
 * El run completo es asíncrono (evita timeouts de Cloudflare) y expone su progreso.
 */
@RestController
@RequiredArgsConstructor
@RequestMapping("/lead-etapa-resumen-backfill")
public class LeadEtapaResumenBackfillController {

    private final LeadEtapaResumenBackfillService backfillService;

    @PostMapping @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<BackfillEstadoResponse> iniciarBackfill() {
        return ResponseEntity.accepted().body(backfillService.iniciarBackfillTodos());
    }

    @GetMapping("/estado") @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<BackfillEstadoResponse> estado() {
        return ResponseEntity.ok(backfillService.estadoActual());
    }

    @PostMapping("/{idLead}") @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<Void> backfillUnLead(@PathVariable Long idLead) {
        backfillService.backfillUnLead(idLead);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/numero/{lead}") @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<Void> backfillPorNumeroLead(@PathVariable String lead) {
        backfillService.backfillPorNumeroLead(lead);
        return ResponseEntity.ok().build();
    }
}
