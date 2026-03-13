package pe.albrugroup.lead_service.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import pe.albrugroup.lead_service.entity.request.PromocionComercialRequest;
import pe.albrugroup.lead_service.entity.response.PromocionComercialResponse;
import pe.albrugroup.lead_service.service.PromocionComercialService;

import java.util.List;

@RestController
@Validated
@RequiredArgsConstructor
@RequestMapping("/promociones")
public class PromocionComercialController {

    private final PromocionComercialService service;

    @PostMapping
    public ResponseEntity<PromocionComercialResponse> registrarPromocion(
            @Valid @RequestBody PromocionComercialRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.registrarPromocion(request));
    }

    @GetMapping
    public ResponseEntity<List<PromocionComercialResponse>> listarPromociones(
            @RequestParam(required = false) Long idProveedor,
            @RequestParam(required = false) Boolean interno,
            @RequestParam(required = false) Long idZona
    ) {
        return ResponseEntity.ok(service.listarPromociones(idProveedor, interno, idZona));
    }

    @DeleteMapping("/{idPromocion}")
    public ResponseEntity<PromocionComercialResponse> desactivarPromocion(@PathVariable Long idPromocion) {
        return ResponseEntity.ok(service.desactivarPromocion(idPromocion));
    }
}
