package pe.albrugroup.gateway_service.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import pe.albrugroup.gateway_service.presence.PresenceService;
import pe.albrugroup.gateway_service.security.AuthenticatedUser;
import reactor.core.publisher.Mono;

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
}
