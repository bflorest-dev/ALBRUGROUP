package pe.albrugroup.lead_service.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import pe.albrugroup.lead_service.entity.request.ProveedorRequest;
import pe.albrugroup.lead_service.entity.response.ProveedorResponse;
import pe.albrugroup.lead_service.service.ProveedorService;

@RestController @Validated
@RequiredArgsConstructor
@RequestMapping("/proveedores")
public class ProveedorController {

    private final ProveedorService proveedorService;

    @PostMapping
    public ResponseEntity<ProveedorResponse> registrarProveedor(@Valid @RequestBody ProveedorRequest request) {
        var proveedor = proveedorService.registrarProveedor(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(proveedor);
    }

    @PatchMapping("/{idProveedor}/estado")
    public ResponseEntity<ProveedorResponse> alternarEstadoProveedor(@PathVariable Long idProveedor) {
        var proveedor = proveedorService.alternarEstadoProveedor(idProveedor);
        return ResponseEntity.ok(proveedor);
    }
}
