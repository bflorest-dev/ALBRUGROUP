package pe.albrugroup.gateway_service.controller;

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
public class PresenceController {

    private final PresenceService presenceService;

    @PostMapping("/online")
    public Mono<ResponseEntity<Void>> registrarEmpleadosOnline(@AuthenticationPrincipal AuthenticatedUser user) {
        return presenceService.registrarEmpleadoOnline(user)
                .thenReturn(ResponseEntity.ok().build());
    }

    @PostMapping("/heartbeat")
    public Mono<ResponseEntity<Void>> heartbeat(@AuthenticationPrincipal AuthenticatedUser user) {
        return presenceService.registrarEmpleadoOnline(user)
                .thenReturn(ResponseEntity.ok().build());
    }

    @PostMapping("/offline")
    public Mono<ResponseEntity<Void>> desconectarEmpleadoOffline(@AuthenticationPrincipal AuthenticatedUser user) {
        return presenceService.desconectarEmpleadoOffline(user)
                .thenReturn(ResponseEntity.noContent().build());
    }
}
