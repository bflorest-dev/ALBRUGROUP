package pe.albrugroup.schedule_service.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import pe.albrugroup.schedule_service.entity.DiaNoLaborable;
import pe.albrugroup.schedule_service.entity.request.horario.DeclararDiaNoLaborableRequest;
import pe.albrugroup.schedule_service.service.DiaNoLaborableService;

import java.time.LocalDate;
import java.util.List;

/**
 * Dias no laborables (feriados / vacaciones / permisos) v2. GLOBAL o por EMPLEADO (lista); el "por
 * equipo" lo expande el llamador. Un dia libre no cuenta FALTA ni afecta balance (ver resolucion en
 * JornadaEfectivaResolver).
 */
@RestController
@Validated
@RequiredArgsConstructor
@RequestMapping("/asistencia/v2/dias-no-laborables")
public class DiaNoLaborableController {

    private final DiaNoLaborableService service;

    @PostMapping
    @PreAuthorize("hasAuthority('UPDATE_HORARIOS')")
    public ResponseEntity<List<DiaNoLaborable>> declarar(@Valid @RequestBody DeclararDiaNoLaborableRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.declarar(request));
    }

    @GetMapping
    @PreAuthorize("hasAnyAuthority('READ_HORARIOS','UPDATE_HORARIOS')")
    public ResponseEntity<List<DiaNoLaborable>> listar(@RequestParam LocalDate fecha) {
        return ResponseEntity.ok(service.listar(fecha));
    }
}
