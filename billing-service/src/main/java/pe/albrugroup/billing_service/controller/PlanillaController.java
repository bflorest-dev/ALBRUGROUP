package pe.albrugroup.billing_service.controller;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.RequiredArgsConstructor;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import pe.albrugroup.billing_service.entity.request.AdelantoSueldoRequest;
import pe.albrugroup.billing_service.entity.request.BonoAdicionalRequest;
import pe.albrugroup.billing_service.entity.request.MatrizPlanillaRequest;
import pe.albrugroup.billing_service.entity.response.AdelantoSueldoResponse;
import pe.albrugroup.billing_service.entity.response.BonoAdicionalResponse;
import pe.albrugroup.billing_service.entity.response.MatrizPlanillaResponse;
import pe.albrugroup.billing_service.entity.response.PlanillaAjustesResponse;
import pe.albrugroup.billing_service.entity.response.PlanillaGeneralResponse;
import pe.albrugroup.billing_service.service.MatrizPlanillaService;
import pe.albrugroup.billing_service.service.PlanillaService;

@RestController @Validated
@RequiredArgsConstructor
@RequestMapping
public class PlanillaController {

    private final PlanillaService planillaService;
    private final MatrizPlanillaService matrizPlanillaService;

    @PostMapping("/planillas/calcular")
    public PlanillaGeneralResponse calcular(
            @RequestParam @Min(2000) Integer anio,
            @RequestParam @Min(1) @Max(12) Integer mes
    ) {
        return planillaService.calcular(anio, mes);
    }

    @GetMapping("/planillas")
    public PlanillaGeneralResponse obtener(
            @RequestParam @Min(2000) Integer anio,
            @RequestParam @Min(1) @Max(12) Integer mes
    ) {
        return planillaService.obtener(anio, mes);
    }

    @PostMapping("/planillas/{id}/aprobar")
    public PlanillaGeneralResponse aprobar(@PathVariable Long id) {
        return planillaService.aprobar(id);
    }

    @GetMapping("/planillas/{id}/ajustes")
    public PlanillaAjustesResponse ajustes(@PathVariable Long id) {
        return planillaService.obtenerAjustes(id);
    }

    @GetMapping("/matriz-planilla/activa")
    public MatrizPlanillaResponse matrizActiva() {
        return matrizPlanillaService.obtenerActivaResponse();
    }

    @PostMapping("/matriz-planilla")
    public MatrizPlanillaResponse crearMatriz(@Valid @RequestBody MatrizPlanillaRequest request) {
        return matrizPlanillaService.crearNuevaVersion(request);
    }

    @PostMapping("/adelantos")
    public AdelantoSueldoResponse registrarAdelanto(@Valid @RequestBody AdelantoSueldoRequest request) {
        return planillaService.registrarAdelanto(request);
    }

    @PostMapping("/bonos-adicionales")
    public BonoAdicionalResponse registrarBonoAdicional(@Valid @RequestBody BonoAdicionalRequest request) {
        return planillaService.registrarBonoAdicional(request);
    }
}
