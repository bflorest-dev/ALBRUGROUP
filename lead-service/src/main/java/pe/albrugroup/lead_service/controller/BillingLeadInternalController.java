package pe.albrugroup.lead_service.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import pe.albrugroup.lead_service.entity.response.billing.VentasValidasBillingResponse;
import pe.albrugroup.lead_service.service.BillingVentasService;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/leads/internal/billing")
public class BillingLeadInternalController {

    private final BillingVentasService billingVentasService;

    @GetMapping("/ventas-validas")
    @PreAuthorize("hasAuthority('SERVICE_INTERNAL')")
    public ResponseEntity<List<VentasValidasBillingResponse>> ventasValidas(
            @RequestParam Integer anio,
            @RequestParam Integer mes
    ) {
        return ResponseEntity.ok(billingVentasService.ventasValidas(anio, mes));
    }
}
