package pe.albrugroup.lead_service.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import pe.albrugroup.lead_service.entity.request.LeadNumeroParaLlamarRequest;
import pe.albrugroup.lead_service.entity.response.NumeroLlamadaResponse;
import pe.albrugroup.lead_service.service.LeadService;

import java.util.List;

@RestController
@Validated
@RequiredArgsConstructor
@RequestMapping
public class LeadController {

    private final LeadService leadService;

    @GetMapping("/{idLead}/numeros-llamada")
    @PreAuthorize("hasAuthority('READ_LEAD_NUMEROS_LLAMADA')")
    public ResponseEntity<List<NumeroLlamadaResponse>> listarNumerosLlamada(@PathVariable Long idLead) {
        return ResponseEntity.ok(leadService.listarNumerosLlamada(idLead));
    }

    @PatchMapping("/{idLead}/numero-para-llamar")
    @PreAuthorize("hasAuthority('UPDATE_LEAD_NUMERO_LLAMADA')")
    public ResponseEntity<Void> actualizarNumeroParaLlamar(
            @PathVariable Long idLead,
            @Valid @RequestBody LeadNumeroParaLlamarRequest request
    ) {
        leadService.actualizarNumeroParaLlamar(idLead, request);
        return ResponseEntity.noContent().build();
    }
}
