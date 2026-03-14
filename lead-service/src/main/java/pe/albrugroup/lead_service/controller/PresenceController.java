package pe.albrugroup.lead_service.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
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
@Tag(name = "Presence Lead", description = "Consulta de empleados conectados y disponibles desde Redis")
public class PresenceController {

    private final PresenceQueryService presenceQueryService;

    @GetMapping("/connected-users")
    @Operation(summary = "Listar usuarios conectados", description = "Lista los empleados conectados. Se puede filtrar por rol.")
    public ResponseEntity<List<ConnectedUserResponse>> listarUsuariosConectados(
            @Parameter(description = "Rol opcional para filtrar conectados", example = "ASESOR")
            @RequestParam(value = "role", required = false) String role
    ) {
        return ResponseEntity.ok(presenceQueryService.listarUsuariosConectados(role));
    }

    @GetMapping("/connected-users/{empleadoId}")
    @Operation(summary = "Validar si un empleado esta conectado", description = "Retorna si el empleado indicado mantiene una clave de presencia activa en Redis.")
    public ResponseEntity<ConnectedStatusResponse> estaConectado(@PathVariable Long empleadoId) {
        return ResponseEntity.ok(presenceQueryService.estaConectado(empleadoId));
    }
}
