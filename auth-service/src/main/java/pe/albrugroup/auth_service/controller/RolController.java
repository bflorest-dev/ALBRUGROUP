package pe.albrugroup.auth_service.controller;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Positive;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
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
import pe.albrugroup.auth_service.entity.Response.AccesoUsuarioResponse;
import pe.albrugroup.auth_service.entity.Response.RolAuditoriaResponse;
import pe.albrugroup.auth_service.entity.Response.RolResponse;
import pe.albrugroup.auth_service.entity.Response.RolesUsuarioResponse;
import pe.albrugroup.auth_service.entity.request.AsignarRolesRequest;
import pe.albrugroup.auth_service.service.RolService;

import java.util.List;

@RestController
@Validated
@RequiredArgsConstructor
@RequestMapping("/autorizacion")
public class RolController {

    private final RolService rolService;

    @GetMapping("/roles")
    @PreAuthorize("hasAuthority('READ_ROLES')")
    public ResponseEntity<List<RolResponse>> catalogo() {
        return ResponseEntity.ok(rolService.catalogo());
    }

    @GetMapping("/usuarios")
    @PreAuthorize("hasAuthority('READ_ROLES')")
    public ResponseEntity<Page<AccesoUsuarioResponse>> listarUsuarios(
            @RequestParam(required = false) String buscar,
            @RequestParam(required = false) Boolean activo,
            @RequestParam(required = false) String rol,
            @RequestParam(required = false) Boolean sinRol,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "25") int size
    ) {
        return ResponseEntity.ok(rolService.listarUsuarios(buscar, activo, rol, sinRol, page, size));
    }

    @GetMapping("/usuarios/{empleadoId}/roles")
    @PreAuthorize("hasAuthority('READ_ROLES')")
    public ResponseEntity<RolesUsuarioResponse> obtenerRoles(@PathVariable @Positive Long empleadoId) {
        return ResponseEntity.ok(rolService.obtenerRoles(empleadoId));
    }

    @PutMapping("/usuarios/{empleadoId}/roles")
    @PreAuthorize("hasAuthority('ASSIGN_ROLES')")
    public ResponseEntity<RolesUsuarioResponse> asignarRoles(
            @PathVariable @Positive Long empleadoId,
            @Valid @RequestBody AsignarRolesRequest request
    ) {
        return ResponseEntity.ok(rolService.asignarRoles(empleadoId, request));
    }

    @GetMapping("/usuarios/{empleadoId}/roles/historial")
    @PreAuthorize("hasAuthority('READ_ROLE_AUDIT')")
    public ResponseEntity<Page<RolAuditoriaResponse>> historial(
            @PathVariable @Positive Long empleadoId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "25") int size
    ) {
        return ResponseEntity.ok(rolService.historial(empleadoId, page, size));
    }
}
