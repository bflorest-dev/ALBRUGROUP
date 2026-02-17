package pe.albrugroup.auth_service.controller;

import jakarta.validation.constraints.Positive;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import pe.albrugroup.auth_service.entity.Response.UsuarioResponse;
import pe.albrugroup.auth_service.entity.enums.PuestoTrabajo;
import pe.albrugroup.auth_service.entity.request.RegistrarUsuarioRequest;
import pe.albrugroup.auth_service.usecase.IUsuario;

import java.util.Set;

@RestController @Validated
@RequiredArgsConstructor @Slf4j
@RequestMapping("/auth")
public class AuthController {

    private final IUsuario usuarioService;

    @PostMapping("/registro")
    public ResponseEntity<UsuarioResponse> registrarUsuario(@RequestBody RegistrarUsuarioRequest request) {
        log.info("Solicitud de registro para usuario: {}", request.getDni());
        var usuario = usuarioService.registrarUsuario(request);
        log.info("Usuario registrado exitosamente: {}", usuario.getUsername());
        return ResponseEntity.status(HttpStatus.CREATED).body(usuario);
    }
    @PatchMapping("{empleadoId}/roles")
    public ResponseEntity<UsuarioResponse> actualizarRoles(@PathVariable @Positive Long empleadoId,
                                                           @RequestBody PuestoTrabajo puesto) {
        log.info("Actualizando roles para usuario: {}", empleadoId);
        var usuario = usuarioService.actualizarRolesUsuario(empleadoId, puesto);
        log.info("Usuario actualizado exitosamente: {}", usuario.getUsername());
        return ResponseEntity.ok(usuario);
    }
    @GetMapping("/{empleadoId}/empleado")
    public ResponseEntity<UsuarioResponse> getUsuarioPorEmpleadoID(@PathVariable @Positive Long empleadoId) {
        log.info("Buscando usuario por empleadoID: {}", empleadoId);
        var usuario = usuarioService.getUsuarioPorEmpleadoID(empleadoId);
        return ResponseEntity.ok(usuario);
    }
    @DeleteMapping("{empleadoId}/deshabilitar")
    public ResponseEntity<Void> deshabilitarUsuario(@PathVariable @Positive Long empleadoId) {
        log.info("Desactivando usuario ID: {}", empleadoId);
        usuarioService.deshabilitarUsuario(empleadoId);
        log.info("Usuario deshabilitado exitosamente: {}", empleadoId);
        return ResponseEntity.noContent().build();
    }
}
