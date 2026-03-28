package pe.albrugroup.rrhh_service.controller;

import jakarta.validation.constraints.Positive;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import pe.albrugroup.rrhh_service.entity.response.EmpleadoEventoResponse;
import pe.albrugroup.rrhh_service.service.EmpleadoEventoService;

import java.util.List;

@RestController
@Validated
@RequiredArgsConstructor
@RequestMapping("/eventos")
public class EventosController {

    private final EmpleadoEventoService empleadoEventoService;

    @GetMapping("/{idEmpleado}/empleados")
    @PreAuthorize("hasAuthority('READ_EVENTOS')")
    public ResponseEntity<List<EmpleadoEventoResponse>> listarEventosEmpleado(
            @PathVariable @Positive Long idEmpleado
    ) {
        return ResponseEntity.ok(empleadoEventoService.listarEventosEmpleado(idEmpleado));
    }
}
