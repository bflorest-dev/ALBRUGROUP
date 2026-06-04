package pe.albrugroup.schedule_service.controller;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Positive;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import pe.albrugroup.schedule_service.entity.request.PageRequest;
import pe.albrugroup.schedule_service.entity.request.horario.FinalizarHorarioRequest;
import pe.albrugroup.schedule_service.entity.request.horario.RegistrarExcepcionHorarioRequest;
import pe.albrugroup.schedule_service.entity.request.horario.RegistrarHorarioRequest;
import pe.albrugroup.schedule_service.entity.request.horario.ReemplazarHorarioRequest;
import pe.albrugroup.schedule_service.entity.request.horario.CorregirHorarioRequest;
import pe.albrugroup.schedule_service.entity.response.PageResponse;
import pe.albrugroup.schedule_service.entity.response.horario.ExcepcionHorarioResponse;
import pe.albrugroup.schedule_service.entity.response.horario.HorarioMesResponse;
import pe.albrugroup.schedule_service.entity.response.horario.HorarioResponse;
import pe.albrugroup.schedule_service.usecase.IHorario;

import java.time.LocalDate;

@RestController
@Validated
@RequiredArgsConstructor
@RequestMapping("/horarios")
public class HorarioController {

    private final IHorario horarioService;

    @PostMapping
    @PreAuthorize("hasAuthority('CREATE_HORARIOS')")
    public ResponseEntity<HorarioResponse> registrarHorario(@Valid @RequestBody RegistrarHorarioRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(horarioService.registrarHorario(request));
    }

    @PutMapping("/{idHorario}")
    @PreAuthorize("hasAuthority('UPDATE_HORARIOS')")
    public ResponseEntity<HorarioResponse> reemplazarHorario(@PathVariable @Positive Long idHorario,
                                                             @Valid @RequestBody ReemplazarHorarioRequest request) {
        return ResponseEntity.ok(horarioService.reemplazarHorario(idHorario, request));
    }

    @PatchMapping("/{idHorario}")
    @PreAuthorize("hasAuthority('UPDATE_HORARIOS')")
    public ResponseEntity<HorarioResponse> corregirHorario(@PathVariable @Positive Long idHorario,
                                                           @Valid @RequestBody CorregirHorarioRequest request) {
        return ResponseEntity.ok(horarioService.corregirHorario(idHorario, request));
    }

    @PatchMapping("/{idHorario}/finalizar")
    @PreAuthorize("hasAuthority('UPDATE_HORARIOS')")
    public ResponseEntity<HorarioResponse> finalizarHorario(@PathVariable @Positive Long idHorario,
                                                            @Valid @RequestBody FinalizarHorarioRequest request) {
        return ResponseEntity.ok(horarioService.finalizarHorario(idHorario, request));
    }

    @PostMapping("/{idHorario}/excepciones")
    @PreAuthorize("hasAnyAuthority('UPDATE_HORARIOS','EXTEND_HORARIO')")
    public ResponseEntity<ExcepcionHorarioResponse> registrarExcepcion(@PathVariable @Positive Long idHorario,
                                                                       @Valid @RequestBody RegistrarExcepcionHorarioRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(horarioService.registrarExcepcion(idHorario, request));
    }

    @PutMapping("/{idHorario}/excepciones/{idExcepcion}")
    @PreAuthorize("hasAnyAuthority('UPDATE_HORARIOS','EXTEND_HORARIO')")
    public ResponseEntity<ExcepcionHorarioResponse> actualizarExcepcion(@PathVariable @Positive Long idHorario,
                                                                         @PathVariable @Positive Long idExcepcion,
                                                                         @Valid @RequestBody RegistrarExcepcionHorarioRequest request) {
        return ResponseEntity.ok(horarioService.actualizarExcepcion(idHorario, idExcepcion, request));
    }

    @DeleteMapping("/{idHorario}/excepciones/{idExcepcion}")
    @PreAuthorize("hasAnyAuthority('UPDATE_HORARIOS','EXTEND_HORARIO')")
    public ResponseEntity<Void> eliminarExcepcion(@PathVariable @Positive Long idHorario,
                                                  @PathVariable @Positive Long idExcepcion) {
        horarioService.eliminarExcepcion(idHorario, idExcepcion);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/mes")
    @PreAuthorize("hasAuthority('READ_HORARIOS_SELF')")
    public ResponseEntity<HorarioMesResponse> getHorarioMes(
            @RequestParam(required = false) Integer anio,
            @RequestParam(required = false) @Min(1) @Max(12) Integer mes
    ) {
        return ResponseEntity.ok(horarioService.getHorarioMes(anio, mes));
    }

    @GetMapping("/empleados/{idEmpleado}/vigente")
    @PreAuthorize("hasAuthority('READ_HORARIOS')")
    public ResponseEntity<HorarioResponse> getHorarioVigente(@PathVariable @Positive Long idEmpleado,
                                                             @RequestParam(required = false) LocalDate fecha) {
        return ResponseEntity.ok(horarioService.getHorarioVigente(idEmpleado, fecha));
    }

    @GetMapping("/empleados/{idEmpleado}/historico")
    @PreAuthorize("hasAuthority('READ_HORARIOS')")
    public ResponseEntity<PageResponse<HorarioResponse>> listarHistorico(@PathVariable @Positive Long idEmpleado,
                                                                         @Valid @ModelAttribute PageRequest pageRequest) {
        return ResponseEntity.ok(horarioService.listarHistorico(idEmpleado, pageRequest));
    }
}
