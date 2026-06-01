package pe.albrugroup.schedule_service.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.constraints.Positive;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import pe.albrugroup.schedule_service.service.BajaEmpleadoService;

@RestController
@Validated
@RequiredArgsConstructor
@Tag(name = "Bajas", description = "Procesamiento de baja de empleados (uso interno entre servicios)")
@RequestMapping("/bajas")
public class BajaController {

    private final BajaEmpleadoService bajaEmpleadoService;

    @PostMapping("/empleado/{empleadoId}")
    @PreAuthorize("hasAuthority('CANCEL_CONTRATOS')")
    @Operation(summary = "Procesar baja de empleado", description = "Cierra horario vigente, fuerza cierre de asistencia abierta y notifica sesion via WebSocket.")
    public ResponseEntity<Void> procesarBaja(@PathVariable @Positive Long empleadoId) {
        bajaEmpleadoService.procesarBajaEmpleado(empleadoId);
        return ResponseEntity.ok().build();
    }
}
