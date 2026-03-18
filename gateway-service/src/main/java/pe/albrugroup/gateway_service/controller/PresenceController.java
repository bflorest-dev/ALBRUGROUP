package pe.albrugroup.gateway_service.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import pe.albrugroup.gateway_service.entity.enums.Disponibilidad;
import pe.albrugroup.gateway_service.entity.enums.PuestoTrabajo;
import pe.albrugroup.gateway_service.entity.response.ConnectedStatusResponse;
import pe.albrugroup.gateway_service.entity.response.ConnectedUserResponse;
import pe.albrugroup.gateway_service.presence.PresenceService;
import pe.albrugroup.gateway_service.security.AuthenticatedUser;
import reactor.core.publisher.Mono;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/presence")
@Tag(name = "Presence Gateway", description = "Registro y mantenimiento de presencia online en Redis")
public class PresenceController {

    private final PresenceService presenceService;

    @PostMapping("/online")
    @Operation(summary = "Registrar empleado online", description = "Registra la presencia inicial del empleado autenticado y crea sus claves con TTL en Redis.")
    public Mono<ResponseEntity<Void>> registrarEmpleadosOnline(@AuthenticationPrincipal AuthenticatedUser user) {
        return presenceService.registrarEmpleadoOnline(user)
                .thenReturn(ResponseEntity.ok().build());
    }

    @PostMapping("/heartbeat")
    @Operation(summary = "Renovar heartbeat", description = "Renueva el TTL de las claves de presencia del empleado autenticado.")
    public Mono<ResponseEntity<Void>> heartbeat(@AuthenticationPrincipal AuthenticatedUser user) {
        return presenceService.registrarEmpleadoOnline(user)
                .thenReturn(ResponseEntity.ok().build());
    }

    @PostMapping("/offline")
    @Operation(summary = "Desconectar empleado", description = "Elimina manualmente las claves de presencia del empleado autenticado.")
    public Mono<ResponseEntity<Void>> desconectarEmpleadoOffline(@AuthenticationPrincipal AuthenticatedUser user) {
        return presenceService.desconectarEmpleadoOffline(user)
                .thenReturn(ResponseEntity.noContent().build());
    }

    @PatchMapping("/disponibilidad/{disponibilidad}")
    @Operation(summary = "Actualizar disponibilidad del empleado", description = "Actualiza la disponibilidad operativa del empleado autenticado en Redis.")
    public Mono<ResponseEntity<Void>> actualizarDisponibilidad(
            @AuthenticationPrincipal AuthenticatedUser user,
            @PathVariable Disponibilidad disponibilidad
    ) {
        return presenceService.actualizarDisponibilidad(user, disponibilidad)
                .thenReturn(ResponseEntity.noContent().build());
    }

    @GetMapping("/connected-users")
    @Operation(summary = "Listar usuarios conectados", description = "Lista los empleados conectados. Se puede filtrar por rol.")
    public Mono<ResponseEntity<List<ConnectedUserResponse>>> listarUsuariosConectados(
            @Parameter(description = "Rol opcional para filtrar conectados", example = "ASESOR_VENTAS")
            @RequestParam(value = "role", required = false) PuestoTrabajo role
    ) {
        return presenceService.listarUsuariosConectados(role)
                .map(ResponseEntity::ok);
    }

    @GetMapping("/connected-users/{empleadoId}")
    @Operation(summary = "Validar si un empleado esta conectado", description = "Retorna si el empleado indicado mantiene una clave de presencia activa en Redis.")
    public Mono<ResponseEntity<ConnectedStatusResponse>> estaConectado(@PathVariable Long empleadoId) {
        return presenceService.estaConectado(empleadoId)
                .map(ResponseEntity::ok);
    }
}
