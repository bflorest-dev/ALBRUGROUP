package pe.albrugroup.auth_service.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Positive;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import pe.albrugroup.auth_service.entity.Response.CredencialesResponse;
import pe.albrugroup.auth_service.entity.Response.EstadoAccesoResponse;
import pe.albrugroup.auth_service.entity.Response.LoginResponse;
import pe.albrugroup.auth_service.entity.Response.TokenRefreshResponse;
import pe.albrugroup.auth_service.entity.Response.UsuarioRolResponse;
import pe.albrugroup.auth_service.entity.Response.UsuarioResponse;
import pe.albrugroup.auth_service.entity.enums.PuestoTrabajo;
import pe.albrugroup.auth_service.entity.request.ActualizarCredencialesRequest;
import pe.albrugroup.auth_service.entity.request.ForgotPasswordRequest;
import pe.albrugroup.auth_service.entity.request.LoginRequest;
import pe.albrugroup.auth_service.entity.request.LogoutRequest;
import pe.albrugroup.auth_service.entity.request.RefreshTokenRequest;
import pe.albrugroup.auth_service.entity.request.RegistrarUsuarioRequest;
import pe.albrugroup.auth_service.exception.NotFoundException;
import pe.albrugroup.auth_service.security.CustomUserDetails;
import pe.albrugroup.auth_service.security.JWTUtil;
import pe.albrugroup.auth_service.service.RefreshTokenService;
import pe.albrugroup.auth_service.usecase.IUsuario;

import java.util.Map;
import java.util.List;

@RestController
@Validated
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Autorizacion", description = "Gestion de autenticacion, credenciales y accesos")
@RequestMapping("/autorizacion")
public class AuthController {

    private final IUsuario usuarioService;
    private final AuthenticationManager authManager;
    private final JWTUtil jwtUtil;
    private final RefreshTokenService refreshTokenService;

    @PostMapping("/login")
    @Operation(summary = "Iniciar sesion", description = "Autentica al usuario y retorna el JWT con su contexto de acceso.")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request) {
        log.info("Intento de login: {}", request.getUsername());

        try {
            Authentication authentication = authManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            request.getUsername(),
                            request.getPassword()
                    )
            );
            CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
            String token = jwtUtil.generateToken(userDetails);
            String refreshToken = refreshTokenService.createRefreshToken(userDetails.getUsuario());

            LoginResponse response = LoginResponse.builder()
                    .token(token)
                    .refreshToken(refreshToken)
                    .type("Bearer")
                    .expiresIn(jwtUtil.getExpiresInSeconds())
                    .username(userDetails.getUsername())
                    .empleadoId(userDetails.getEmpleadoId())
                    .nombreCompleto(userDetails.getNombreCompleto())
                    .roles(userDetails.getAuthorities().stream()
                            .filter(auth -> auth.getAuthority().startsWith("ROLE_"))
                            .map(auth -> auth.getAuthority().replace("ROLE_", ""))
                            .toList())
                    .build();
            log.info("Login Exitoso: {}", request.getUsername());
            return ResponseEntity.ok(response);
        } catch (BadCredentialsException e) {
            log.error("Credenciales invalidas para: {}", request.getUsername());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of(
                    "status", HttpStatus.UNAUTHORIZED.value(),
                    "error", HttpStatus.UNAUTHORIZED.getReasonPhrase(),
                    "message", "Credenciales invalidas"
            ));
        } catch (DisabledException e) {
            log.warn("Login rechazado para usuario inactivo: {}", request.getUsername());
            throw new NotFoundException("Usuario no encontrado");
        }
    }

    @PostMapping("/refresh")
    @Operation(summary = "Renovar token", description = "Rota un refresh token valido y retorna un nuevo JWT de acceso.")
    public ResponseEntity<TokenRefreshResponse> refresh(@Valid @RequestBody RefreshTokenRequest request) {
        var tokens = refreshTokenService.rotate(request.getRefreshToken());
        return ResponseEntity.ok(TokenRefreshResponse.builder()
                .token(tokens.accessToken())
                .refreshToken(tokens.refreshToken())
                .type("Bearer")
                .expiresIn(tokens.expiresIn())
                .build());
    }

    @PostMapping("/logout")
    @Operation(summary = "Cerrar sesion", description = "Revoca el refresh token recibido.")
    public ResponseEntity<Void> logout(@Valid @RequestBody LogoutRequest request) {
        refreshTokenService.revoke(request.getRefreshToken());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/upsert-usuario")
    @PreAuthorize("hasAuthority('CREATE_CONTRATOS')")
    @Operation(summary = "Crear o sincronizar usuario", description = "Registra o actualiza el usuario de autenticacion asociado a un empleado.")
    public ResponseEntity<Void> upsertUsuario(@Valid @RequestBody RegistrarUsuarioRequest request) {
        log.info("Solicitud de alta/sincronizacion para usuario: {}", request.getDni());
        usuarioService.upsertUsuario(request);
        log.info("Usuario sincronizado correctamente para empleado: {}", request.getEmpleadoId());
        return ResponseEntity.ok().build();
    }

    @PatchMapping("{empleadoId}/username-roles")
    @PreAuthorize("hasAuthority('UPDATE_EMPLEADOS')")
    @Operation(summary = "Actualizar credenciales y roles", description = "Actualiza username y configuracion de roles del usuario por empleado.")
    public ResponseEntity<UsuarioResponse> actualizarUsernameRoles(
            @PathVariable @Positive Long empleadoId,
            @Valid @RequestBody ActualizarCredencialesRequest request
    ) {
        log.info("Actualizando username/roles para usuario: {}", empleadoId);
        var usuario = usuarioService.actualizarUsernameRoles(empleadoId, request);
        log.info("Usuario actualizado exitosamente: {}", usuario.getUsername());
        return ResponseEntity.ok(usuario);
    }

    @PostMapping("{empleadoId}/reset-password")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    @Operation(summary = "Resetear password", description = "Genera nuevas credenciales temporales para el usuario del empleado indicado.")
    public ResponseEntity<CredencialesResponse> resetPassword(@PathVariable @Positive Long empleadoId) {
        log.info("Reseteando password para usuario: {}", empleadoId);
        var credenciales = usuarioService.resetPassword(empleadoId);
        log.info("Password reseteado para usuario: {}", credenciales.getUsername());
        return ResponseEntity.ok(credenciales);
    }

    @PostMapping("/forgot-password")
    @Operation(summary = "Recuperar password", description = "Regenera credenciales a partir del username reportado por el usuario.")
    public ResponseEntity<CredencialesResponse> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        log.info("Recuperando password para username: {}", request.getUsername());
        var credenciales = usuarioService.forgotPassword(request);
        log.info("Password regenerado correctamente para username: {}", credenciales.getUsername());
        return ResponseEntity.ok(credenciales);
    }

    @GetMapping("/estado-acceso/{username}")
    @Operation(summary = "Consultar estado de acceso", description = "Retorna el estado de acceso actual asociado al username.")
    public ResponseEntity<EstadoAccesoResponse> getEstadoAcceso(@PathVariable String username) {
        log.info("Consultando estado de acceso para username: {}", username);
        return ResponseEntity.ok(usuarioService.getEstadoAcceso(username));
    }

    @GetMapping("/{empleadoId}/empleado")
    @PreAuthorize("hasAuthority('READ_EMPLEADOS')")
    @Operation(summary = "Obtener usuario por empleado", description = "Busca el usuario de autenticacion asociado a un empleado.")
    public ResponseEntity<UsuarioResponse> getUsuarioPorEmpleadoID(@PathVariable @Positive Long empleadoId) {
        log.info("Buscando usuario por empleadoID: {}", empleadoId);
        var usuario = usuarioService.getUsuarioPorEmpleadoID(empleadoId);
        return ResponseEntity.ok(usuario);
    }

    @GetMapping("/roles/{puestoTrabajo}/usuarios")
    @PreAuthorize("hasAnyAuthority('READ_EMPLEADOS','READ_LEADS_GTR','READ_LEADS_SUPERVISOR_VENTAS_RESUMEN')")
    @Operation(summary = "Listar usuarios activos por rol", description = "Retorna los usuarios activos asociados al rol solicitado.")
    public ResponseEntity<List<UsuarioRolResponse>> listarUsuariosActivosPorRol(@PathVariable PuestoTrabajo puestoTrabajo) {
        return ResponseEntity.ok(usuarioService.listarUsuariosActivosPorRol(puestoTrabajo));
    }

    @DeleteMapping("{empleadoId}/deshabilitar")
    @PreAuthorize("hasAuthority('CANCEL_CONTRATOS')")
    @Operation(summary = "Deshabilitar usuario", description = "Desactiva el acceso del usuario vinculado al empleado indicado.")
    public ResponseEntity<Void> deshabilitarUsuario(@PathVariable @Positive Long empleadoId) {
        log.info("Desactivando usuario ID: {}", empleadoId);
        usuarioService.deshabilitarUsuario(empleadoId);
        log.info("Usuario deshabilitado exitosamente: {}", empleadoId);
        return ResponseEntity.noContent().build();
    }
}
