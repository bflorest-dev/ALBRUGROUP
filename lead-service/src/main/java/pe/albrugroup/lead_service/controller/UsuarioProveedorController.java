package pe.albrugroup.lead_service.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;
import pe.albrugroup.lead_service.entity.enums.AmbitoProveedor;
import pe.albrugroup.lead_service.entity.request.ReconciliarRolesScopeRequest;
import pe.albrugroup.lead_service.entity.request.UsuarioProveedoresRequest;
import pe.albrugroup.lead_service.entity.response.AsignacionUsuarioProveedorResponse;
import pe.albrugroup.lead_service.entity.response.ProveedorResponse;
import pe.albrugroup.lead_service.service.ProveedorScopeService;
import pe.albrugroup.lead_service.service.UsuarioProveedorService;
import pe.albrugroup.lead_service.service.mapper.ProveedorMapper;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
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

    @Value("${internal.shared-secret:}")
    private String internalSharedSecret;

    @GetMapping("/proveedores")
    @PreAuthorize("hasAuthority('READ_USUARIO_PROVEEDORES')")
    public ResponseEntity<List<AsignacionUsuarioProveedorResponse>> listarAsignaciones(
            @RequestParam AmbitoProveedor ambito
    ) {
        return ResponseEntity.ok(usuarioProveedorService.listarAsignaciones(ambito));
    }

    @GetMapping("/{idEmpleado}/proveedores")
    @PreAuthorize("hasAuthority('READ_USUARIO_PROVEEDORES')")
    public ResponseEntity<List<ProveedorResponse>> listarProveedores(
            @PathVariable Long idEmpleado,
            @RequestParam AmbitoProveedor ambito
    ) {
        return ResponseEntity.ok(usuarioProveedorService.listarProveedoresDeEmpleado(idEmpleado, ambito));
    }

    @PutMapping("/{idEmpleado}/proveedores")
    @PreAuthorize("hasAuthority('ASSIGN_USUARIO_PROVEEDORES')")
    public ResponseEntity<List<ProveedorResponse>> asignarProveedores(
            @PathVariable Long idEmpleado,
            @RequestParam AmbitoProveedor ambito,
            @Valid @RequestBody UsuarioProveedoresRequest request
    ) {
        return ResponseEntity.ok(
                usuarioProveedorService.asignarProveedores(idEmpleado, ambito, request.getProveedorIds()));
    }

    @org.springframework.web.bind.annotation.PostMapping("/{idEmpleado}/proveedores/reconciliar-roles")
    @PreAuthorize("hasAuthority('ASSIGN_USUARIO_PROVEEDORES')")
    public ResponseEntity<Void> reconciliarScopePorRoles(
            @PathVariable Long idEmpleado,
            @RequestHeader(name = "X-Internal-Secret", required = false) String suppliedSecret,
            @Valid @RequestBody ReconciliarRolesScopeRequest request
    ) {
        if (!secretoInternoValido(suppliedSecret)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Secreto interno invalido");
        }
        usuarioProveedorService.reconciliarScopePorRoles(idEmpleado, request.getRoles());
        return ResponseEntity.noContent().build();
    }

    /** Proveedores del usuario autenticado según su rol (para el selector del sidebar). */
    @GetMapping("/mis-proveedores")
    public ResponseEntity<List<ProveedorResponse>> misProveedores() {
        List<ProveedorResponse> proveedores = proveedorScopeService.misProveedores().stream()
                .map(proveedorMapper::toResponse)
                .toList();
        return ResponseEntity.ok(proveedores);
    }

    private boolean secretoInternoValido(String suppliedSecret) {
        return internalSharedSecret != null && !internalSharedSecret.isBlank()
                && suppliedSecret != null
                && MessageDigest.isEqual(
                        internalSharedSecret.getBytes(StandardCharsets.UTF_8),
                        suppliedSecret.getBytes(StandardCharsets.UTF_8));
    }
}
