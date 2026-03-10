package pe.albrugroup.lead_service.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import pe.albrugroup.lead_service.entity.request.ZonaRequest;
import pe.albrugroup.lead_service.entity.response.ZonaResponse;
import pe.albrugroup.lead_service.service.ZonaService;

@RestController
@Validated
@RequiredArgsConstructor
@RequestMapping("/zonas")
public class ZonaController {

    private final ZonaService zonaService;

    @PostMapping
    public ResponseEntity<ZonaResponse> registrarZona(@Valid @RequestBody ZonaRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(zonaService.registrarZona(request));
    }
}
