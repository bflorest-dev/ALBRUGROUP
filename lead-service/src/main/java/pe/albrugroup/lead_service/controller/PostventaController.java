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
    // 2. Registrar evento de contacto con el Lead
    // 3. Ver detalle del Lead
    // 4. Ver el historial de eventos de un Lead
    // 5. Registrar encuesta

    // 9. Tipificar Leads, cualquier tipi que cambie de etapa limpia el Lead

}
