package pe.albrugroup.schedule_service.controller;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Positive;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import pe.albrugroup.schedule_service.entity.request.horario.AjusteJornadaRequest;
import pe.albrugroup.schedule_service.entity.response.horario.AjusteJornadaResponse;
import pe.albrugroup.schedule_service.entity.response.horario.JornadaEfectivaResponse;
import pe.albrugroup.schedule_service.entity.response.horario.PreviewAjusteJornadaResponse;
import pe.albrugroup.schedule_service.service.AjusteJornadaService;

import java.time.LocalDate;
import java.util.List;

@RestController
@Validated
@RequiredArgsConstructor
@RequestMapping("/horarios/empleados/{idEmpleado}")
public class AjusteJornadaController {

    private final AjusteJornadaService service;

    @GetMapping("/jornada-efectiva")
    @PreAuthorize("hasAnyAuthority('READ_HORARIOS','READ_HORARIOS_SELF','UPDATE_HORARIOS')")
    public ResponseEntity<JornadaEfectivaResponse> jornada(
            @PathVariable @Positive Long idEmpleado,
            @RequestParam(required = false) LocalDate fecha
    ) {
        return ResponseEntity.ok(service.getJornada(idEmpleado, fecha));
    }

    @PostMapping("/ajustes/preview")
    @PreAuthorize("hasAuthority('UPDATE_HORARIOS')")
    public ResponseEntity<PreviewAjusteJornadaResponse> preview(
            @PathVariable @Positive Long idEmpleado,
            @Valid @RequestBody AjusteJornadaRequest request
    ) {
        return ResponseEntity.ok(service.preview(idEmpleado, request));
    }

    @PostMapping("/ajustes")
    @PreAuthorize("hasAuthority('UPDATE_HORARIOS')")
    public ResponseEntity<AjusteJornadaResponse> registrar(
            @PathVariable @Positive Long idEmpleado,
            @Valid @RequestBody AjusteJornadaRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.registrar(idEmpleado, request));
    }

    @GetMapping("/ajustes")
    @PreAuthorize("hasAnyAuthority('READ_HORARIOS','UPDATE_HORARIOS')")
    public ResponseEntity<List<AjusteJornadaResponse>> listar(
            @PathVariable @Positive Long idEmpleado,
            @RequestParam(required = false) LocalDate fecha
    ) {
        return ResponseEntity.ok(service.listar(idEmpleado, fecha));
    }

    @PostMapping("/ajustes/{idAjuste}/cancelar")
    @PreAuthorize("hasAuthority('UPDATE_HORARIOS')")
    public ResponseEntity<AjusteJornadaResponse> cancelar(
            @PathVariable @Positive Long idEmpleado,
            @PathVariable @Positive Long idAjuste
    ) {
        return ResponseEntity.ok(service.cancelar(idEmpleado, idAjuste));
    }
}
