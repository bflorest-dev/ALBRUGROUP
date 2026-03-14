package pe.albrugroup.lead_service.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import pe.albrugroup.lead_service.entity.response.ConnectedStatusResponse;
import pe.albrugroup.lead_service.entity.response.ConnectedUserResponse;
import pe.albrugroup.lead_service.service.PresenceQueryService;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/presence")
public class PresenceController {

    private final PresenceQueryService presenceQueryService;

    @GetMapping("/connected-users")
    public ResponseEntity<List<ConnectedUserResponse>> listarUsuariosConectados(
            @RequestParam(value = "role", required = false) String role
    ) {
        return ResponseEntity.ok(presenceQueryService.listarUsuariosConectados(role));
    }

    @GetMapping("/connected-users/{empleadoId}")
    public ResponseEntity<ConnectedStatusResponse> estaConectado(@PathVariable Long empleadoId) {
        return ResponseEntity.ok(presenceQueryService.estaConectado(empleadoId));
    }
}
