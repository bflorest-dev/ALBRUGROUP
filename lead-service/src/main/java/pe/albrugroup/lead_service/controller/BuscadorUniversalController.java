package pe.albrugroup.lead_service.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import pe.albrugroup.lead_service.entity.request.BuscadorUniversalFilter;
import pe.albrugroup.lead_service.entity.response.ColumnaMetadataResponse;
import pe.albrugroup.lead_service.service.BuscadorUniversalService;

import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping("/admin/buscador-universal")
public class BuscadorUniversalController {

    private final BuscadorUniversalService service;

    @GetMapping
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<Page<Map<String, Object>>> buscar(
            BuscadorUniversalFilter filter, Pageable pageable) {
        return ResponseEntity.ok(service.buscar(filter, pageable));
    }

    @GetMapping("/columnas")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<List<ColumnaMetadataResponse>> columnas() {
        return ResponseEntity.ok(service.listarColumnas());
    }
}
