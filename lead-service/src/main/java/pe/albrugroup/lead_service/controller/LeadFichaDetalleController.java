package pe.albrugroup.lead_service.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import pe.albrugroup.lead_service.entity.enums.Etapa;
import pe.albrugroup.lead_service.entity.response.LeadFichaDetalleResponse;
import pe.albrugroup.lead_service.service.LeadFichaDetalleService;

@RestController
@RequiredArgsConstructor
@RequestMapping("/ficha-detalle")
public class LeadFichaDetalleController {

    private final LeadFichaDetalleService fichaDetalleService;

    @GetMapping("/{idLead}")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public LeadFichaDetalleResponse obtenerFichaDetalle(
            @PathVariable Long idLead,
            @RequestParam(defaultValue = "PREVENTA") Etapa etapa) {
        return fichaDetalleService.obtenerFichaDetalle(idLead, etapa);
    }
}
