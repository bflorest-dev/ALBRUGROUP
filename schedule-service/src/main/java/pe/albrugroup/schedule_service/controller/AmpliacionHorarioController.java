package pe.albrugroup.schedule_service.controller;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Positive;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import pe.albrugroup.schedule_service.entity.request.horario.RegistrarAmpliacionRequest;
import pe.albrugroup.schedule_service.entity.response.horario.AmpliacionContextoResponse;
import pe.albrugroup.schedule_service.entity.response.horario.AmpliacionHorarioResponse;
import pe.albrugroup.schedule_service.usecase.IAsistencia;

import java.time.LocalDate;

/**
 * Ampliaciones puntuales de horario por empleado.
 *
 * Keyed por idEmpleado (no por idHorario) para que las areas operativas no manejen IDs tecnicos:
 * el backend resuelve internamente el horario vigente. Requiere EXTEND_HORARIO (o UPDATE_HORARIOS),
 * sin necesidad de READ_HORARIOS.
 */
@RestController
@Validated
@RequiredArgsConstructor
@RequestMapping("/horarios/empleados/{idEmpleado}/ampliaciones")
public class AmpliacionHorarioController {

    private final IAsistencia asistenciaService;

    @GetMapping("/contexto")
    @PreAuthorize("hasAnyAuthority('UPDATE_HORARIOS','EXTEND_HORARIO')")
    public ResponseEntity<AmpliacionContextoResponse> getContexto(@PathVariable @Positive Long idEmpleado,
                                                                  @RequestParam(required = false) LocalDate fecha) {
        return ResponseEntity.ok(asistenciaService.getContextoAmpliacion(idEmpleado, fecha));
    }

    @PostMapping
    @PreAuthorize("hasAnyAuthority('UPDATE_HORARIOS','EXTEND_HORARIO')")
    public ResponseEntity<AmpliacionHorarioResponse> registrar(@PathVariable @Positive Long idEmpleado,
                                                               @Valid @RequestBody RegistrarAmpliacionRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(asistenciaService.registrarAmpliacion(idEmpleado, request));
    }
}
