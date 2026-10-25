package pe.albrugroup.lead_service.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import pe.albrugroup.lead_service.entity.response.ComisionVentaResponse;
import pe.albrugroup.lead_service.service.ComisionVentaService;

import java.time.LocalDate;

@RestController
@Validated
@RequiredArgsConstructor
@RequestMapping("/comisiones")
public class ComisionVentaController {

    private final ComisionVentaService comisionVentaService;

    @GetMapping("/ventas-por-corte")
    @PreAuthorize("hasAuthority('READ_POSTVENTA_GESTION_MENSUAL')")
    public ResponseEntity<ComisionVentaResponse> obtenerVentasPorCorte(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate mesComision,
            @RequestParam(required = false, defaultValue = "WIN") String proveedor
    ) {
        return ResponseEntity.ok(comisionVentaService.calcularVentasPorCorte(mesComision, proveedor));
    }
}
