package pe.albrugroup.lead_service.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import pe.albrugroup.lead_service.entity.request.ZonaRequest;
import pe.albrugroup.lead_service.entity.response.ZonaResponse;
import pe.albrugroup.lead_service.service.ZonaService;

import java.util.List;

@RestController
@Validated
@RequiredArgsConstructor
@RequestMapping("/zonas")
public class ZonaController {

    private final ZonaService zonaService;

    @PostMapping @PreAuthorize("hasAuthority('CREATE_ZONAS')")
    public ResponseEntity<ZonaResponse> registrarZona(@Valid @RequestBody ZonaRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(zonaService.registrarZona(request));
    }

    @GetMapping @PreAuthorize("hasAuthority('READ_ZONAS')")
    public ResponseEntity<List<ZonaResponse>> listarZonas(@RequestParam(required = false) Boolean activo) {
        return ResponseEntity.ok(zonaService.listarZonas(activo));
    }

    @PatchMapping("/{idZona}/estado") @PreAuthorize("hasAuthority('UPDATE_ZONAS')")
    public ResponseEntity<ZonaResponse> alternarEstadoZona(@PathVariable Long idZona) {
        return ResponseEntity.ok(zonaService.alternarEstadoZona(idZona));
    }

    @PutMapping("/{idZona}") @PreAuthorize("hasAuthority('UPDATE_ZONAS')")
    public ResponseEntity<ZonaResponse> actualizarZona(@PathVariable Long idZona,
                                                       @Valid @RequestBody ZonaRequest request) {
        return ResponseEntity.ok(zonaService.actualizarZona(idZona, request));
    }
}
