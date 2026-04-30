package pe.albrugroup.lead_service.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import pe.albrugroup.lead_service.service.LeadService;

@RestController @Validated
@RequiredArgsConstructor
@RequestMapping("/postventa")
public class PostventaController {

    private final LeadService leadService;

    // Asesor Posventa

    // 1. Listar Leads que se encuentren en la etapa de POSTVENTA

    // 2. Listar Leads asignados a

}
