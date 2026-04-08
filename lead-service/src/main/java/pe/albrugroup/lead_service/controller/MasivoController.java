package pe.albrugroup.lead_service.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import pe.albrugroup.lead_service.entity.enums.Etapa;
import pe.albrugroup.lead_service.entity.response.LeadGtrResponse;
import pe.albrugroup.lead_service.service.MasivoService;

import java.util.List;

@RestController @Validated
@RequiredArgsConstructor
@RequestMapping("/masivo")
public class MasivoController {

    private final MasivoService masivoService;

    @GetMapping("/leads") @PreAuthorize("hasAuthority('READ_LEADS_GTR')")
    public ResponseEntity<List<LeadGtrResponse>> listarLeadsMasivo(
            @RequestParam(required = false) Long idProveedor,
            @RequestParam(required = false) Etapa etapa,
            @RequestParam(required = false) List<Long> tipificaciones,
            @RequestParam(required = false) List<Long> subtipificaciones
    ) {
        var leads = masivoService.listarLeads(idProveedor, etapa, tipificaciones, subtipificaciones);
        return ResponseEntity.status(HttpStatus.OK).body(leads);
    }
}
