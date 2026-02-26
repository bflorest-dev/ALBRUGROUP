package pe.albrugroup.auth_service.controller;

import jakarta.validation.constraints.Positive;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import pe.albrugroup.auth_service.entity.Response.LoginResponse;
import pe.albrugroup.auth_service.entity.Response.CredencialesResponse;
import pe.albrugroup.auth_service.entity.Response.UsuarioResponse;
import pe.albrugroup.auth_service.entity.enums.PuestoTrabajo;
import pe.albrugroup.auth_service.entity.request.ActualizarCredencialesRequest;
import pe.albrugroup.auth_service.entity.request.LoginRequest;
import pe.albrugroup.auth_service.entity.request.RegistrarUsuarioRequest;
import pe.albrugroup.auth_service.security.CustomUserDetails;
import pe.albrugroup.auth_service.security.JWTUtil;
import pe.albrugroup.auth_service.usecase.IUsuario;

@RestController @Validated
@RequiredArgsConstructor @Slf4j
@RequestMapping("/autorizacion")
public class AuthController {

    private final IUsuario usuarioService;
    private final AuthenticationManager authManager;
    private final JWTUtil jwtUtil;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        log.info("Intento de login: {}", request.getUsername());

        try {
            Authentication authentication = authManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            request.getUsername(),
                            request.getPassword()
                    )
            );
            CustomUserDetails  userDetails = (CustomUserDetails) authentication.getPrincipal();
            String token = jwtUtil.generateToken(userDetails);

            LoginResponse response = LoginResponse.builder()
                    .token(token)
                    .type("Bearer")
                    .username(userDetails.getUsername())
                    .empleadoId(userDetails.getEmpleadoId())
                    .roles(userDetails.getAuthorities().stream()
                            .filter(auth -> auth.getAuthority().startsWith("ROLE_"))
                            .map(auth -> auth.getAuthority().replace("ROLE_", ""))
                            .toList())
                    .build();
            log.info("Login Exitoso: {}", request.getUsername());
            return ResponseEntity.ok(response);
        } catch (BadCredentialsException e) {
            log.error("Credenciales inválidas para: {}", request.getUsername());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Credenciales inválidas");
        }
    }

    @PostMapping("/registro") @PreAuthorize("hasAnyRole('ADMINISTRADOR','RRHH')")
    public ResponseEntity<UsuarioResponse> registrarUsuario(@RequestBody RegistrarUsuarioRequest request) {
        log.info("Solicitud de registro para usuario: {}", request.getDni());
        var usuario = usuarioService.registrarUsuario(request);
        log.info("Usuario registrado exitosamente: {}", usuario.getUsername());
        return ResponseEntity.status(HttpStatus.CREATED).body(usuario);
    }
    @PostMapping("/registro-credenciales") @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<CredencialesResponse> registrarUsuarioConCredenciales(@RequestBody RegistrarUsuarioRequest request) {
        log.info("Solicitud de registro con credenciales para usuario: {}", request.getDni());
        var credenciales = usuarioService.registrarUsuarioConCredenciales(request);
        log.info("Usuario registrado con credenciales: {}", credenciales.getUsername());
        return ResponseEntity.status(HttpStatus.CREATED).body(credenciales);
    }
    @PatchMapping("{empleadoId}/roles")
    public ResponseEntity<UsuarioResponse> actualizarRoles(@PathVariable @Positive Long empleadoId,
                                                           @RequestBody PuestoTrabajo puesto) {
        log.info("Actualizando roles para usuario: {}", empleadoId);
        var usuario = usuarioService.actualizarRolesUsuario(empleadoId, puesto);
        log.info("Usuario actualizado exitosamente: {}", usuario.getUsername());
        return ResponseEntity.ok(usuario);
    }
    @PatchMapping("{empleadoId}/username-roles") @PreAuthorize("hasAnyRole('ADMINISTRADOR','RRHH')")
    public ResponseEntity<UsuarioResponse> actualizarUsernameRoles(@PathVariable @Positive Long empleadoId,
                                                                   @RequestBody ActualizarCredencialesRequest request) {
        log.info("Actualizando username/roles para usuario: {}", empleadoId);
        var usuario = usuarioService.actualizarUsernameRoles(empleadoId, request);
        log.info("Usuario actualizado exitosamente: {}", usuario.getUsername());
        return ResponseEntity.ok(usuario);
    }
    @PostMapping("{empleadoId}/reset-password") @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<CredencialesResponse> resetPassword(@PathVariable @Positive Long empleadoId) {
        log.info("Reseteando password para usuario: {}", empleadoId);
        var credenciales = usuarioService.resetPassword(empleadoId);
        log.info("Password reseteado para usuario: {}", credenciales.getUsername());
        return ResponseEntity.ok(credenciales);
    }
    @GetMapping("/{empleadoId}/empleado") @PreAuthorize("hasAnyRole('ADMINISTRADOR','RRHH')")
    public ResponseEntity<UsuarioResponse> getUsuarioPorEmpleadoID(@PathVariable @Positive Long empleadoId) {
        log.info("Buscando usuario por empleadoID: {}", empleadoId);
        var usuario = usuarioService.getUsuarioPorEmpleadoID(empleadoId);
        return ResponseEntity.ok(usuario);
    }
    @DeleteMapping("{empleadoId}/deshabilitar") @PreAuthorize("hasAnyRole('ADMINISTRADOR','RRHH')")
    public ResponseEntity<Void> deshabilitarUsuario(@PathVariable @Positive Long empleadoId) {
        log.info("Desactivando usuario ID: {}", empleadoId);
        usuarioService.deshabilitarUsuario(empleadoId);
        log.info("Usuario deshabilitado exitosamente: {}", empleadoId);
        return ResponseEntity.noContent().build();
    }
}
