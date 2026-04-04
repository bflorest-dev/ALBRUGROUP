package pe.albrugroup.lead_service.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import pe.albrugroup.lead_service.service.LeadService;

@RestController @Validated
@RequiredArgsConstructor
@RequestMapping("/masivo")
public class MasivoController {

    private final LeadService leadService;

    // Parametros para consultar listados de Leads
    // 1. Campana.Proveedor.nombre = WIN, Etapa = PREVENTA, Tipificacion = Preventa Incompleta
    //
}
