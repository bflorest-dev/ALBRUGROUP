package pe.albrugroup.lead_service.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import pe.albrugroup.lead_service.entity.request.EncuestaPostventaRequest;
import pe.albrugroup.lead_service.entity.request.PageRequest;
import pe.albrugroup.lead_service.entity.response.EncuestaPostventaResponse;
import pe.albrugroup.lead_service.entity.response.PageResponse;
import pe.albrugroup.lead_service.entity.response.SatisfaccionPostventaResponse;
import pe.albrugroup.lead_service.service.EncuestaPostventaService;

@RestController @Validated
@RequiredArgsConstructor
@RequestMapping("/postventa/leads/{idLead}/encuestas")
public class PostventaEncuestaController {

    private final EncuestaPostventaService encuestaPostventaService;

    @PostMapping @PreAuthorize("hasAuthority('UPDATE_LEADS_ASESOR')")
    public ResponseEntity<EncuestaPostventaResponse> registrarEncuesta(
            @PathVariable Long idLead,
            @Valid @RequestBody EncuestaPostventaRequest request
    ) {
        var encuesta = encuestaPostventaService.registrarEncuesta(idLead, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(encuesta);
    }

    @GetMapping @PreAuthorize("hasAuthority('READ_LEADS_ASESOR')")
    public ResponseEntity<PageResponse<EncuestaPostventaResponse>> listarEncuestasPorLead(
            @PathVariable Long idLead,
            @Valid @ModelAttribute PageRequest pageRequest
    ) {
        var encuestas = encuestaPostventaService.listarEncuestasPorLead(idLead, pageRequest);
        return ResponseEntity.status(HttpStatus.OK).body(encuestas);
    }

    @GetMapping("/resumen") @PreAuthorize("hasAuthority('READ_LEADS_ASESOR')")
    public ResponseEntity<SatisfaccionPostventaResponse> obtenerResumenEncuestasPorLead(
            @PathVariable Long idLead
    ) {
        var resumen = encuestaPostventaService.obtenerResumenEncuestasPorLead(idLead);
        return ResponseEntity.status(HttpStatus.OK).body(resumen);
    }
}
