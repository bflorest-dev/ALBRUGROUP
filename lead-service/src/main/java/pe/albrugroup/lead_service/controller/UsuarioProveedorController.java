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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import pe.albrugroup.lead_service.entity.Proveedor;
import pe.albrugroup.lead_service.entity.enums.AmbitoProveedor;
import pe.albrugroup.lead_service.entity.request.UsuarioProveedoresRequest;
import pe.albrugroup.lead_service.entity.response.AsignacionUsuarioProveedorResponse;
import pe.albrugroup.lead_service.entity.response.ProveedorResponse;
import pe.albrugroup.lead_service.service.ProveedorScopeService;
import pe.albrugroup.lead_service.service.UsuarioProveedorService;
import pe.albrugroup.lead_service.service.mapper.ProveedorMapper;

import java.util.List;

/**
 * Administración del scope por proveedor (ADMIN) y consulta de "mis proveedores" del usuario actual.
 * Cubre BACKOFFICE y POSTVENTA vía el parámetro {@code ambito}.
 */
@RestController
@Validated
@RequiredArgsConstructor
@RequestMapping("/usuarios")
public class UsuarioProveedorController {

    private final UsuarioProveedorService usuarioProveedorService;
    private final ProveedorScopeService proveedorScopeService;
    private final ProveedorMapper proveedorMapper;

    @GetMapping("/proveedores")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<List<AsignacionUsuarioProveedorResponse>> listarAsignaciones(
            @RequestParam AmbitoProveedor ambito
    ) {
        return ResponseEntity.ok(usuarioProveedorService.listarAsignaciones(ambito));
    }

    @GetMapping("/{idEmpleado}/proveedores")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<List<ProveedorResponse>> listarProveedores(
            @PathVariable Long idEmpleado,
            @RequestParam AmbitoProveedor ambito
    ) {
        return ResponseEntity.ok(usuarioProveedorService.listarProveedoresDeEmpleado(idEmpleado, ambito));
    }

    @PutMapping("/{idEmpleado}/proveedores")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<List<ProveedorResponse>> asignarProveedores(
            @PathVariable Long idEmpleado,
            @RequestParam AmbitoProveedor ambito,
            @Valid @RequestBody UsuarioProveedoresRequest request
    ) {
        return ResponseEntity.ok(
                usuarioProveedorService.asignarProveedores(idEmpleado, ambito, request.getProveedorIds()));
    }

    /** Proveedores del usuario autenticado según su rol (para el selector del sidebar). */
    @GetMapping("/mis-proveedores")
    public ResponseEntity<List<ProveedorResponse>> misProveedores() {
        List<ProveedorResponse> proveedores = proveedorScopeService.misProveedores().stream()
                .map(proveedorMapper::toResponse)
                .toList();
        return ResponseEntity.ok(proveedores);
    }
}
