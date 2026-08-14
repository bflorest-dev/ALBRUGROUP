package pe.albrugroup.lead_service.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import pe.albrugroup.lead_service.entity.request.PostventaAsesorProveedoresRequest;
import pe.albrugroup.lead_service.entity.response.ProveedorResponse;
import pe.albrugroup.lead_service.service.PostventaAsesorProveedorService;

import java.util.List;

@RestController
@Validated
@RequiredArgsConstructor
@RequestMapping("/postventa/asesores")
public class PostventaAsesorProveedorController {

    private final PostventaAsesorProveedorService service;

    @GetMapping("/{idEmpleado}/proveedores")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<List<ProveedorResponse>> listarProveedores(@PathVariable Long idEmpleado) {
        return ResponseEntity.ok(service.listarProveedoresDeAsesor(idEmpleado));
    }

    @PutMapping("/{idEmpleado}/proveedores")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<List<ProveedorResponse>> asignarProveedores(
            @PathVariable Long idEmpleado,
            @Valid @RequestBody PostventaAsesorProveedoresRequest request
    ) {
        return ResponseEntity.ok(service.asignarProveedores(idEmpleado, request.getProveedorIds()));
    }
}
