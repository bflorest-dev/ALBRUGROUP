package pe.albrugroup.schedule_service.controller;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Positive;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import pe.albrugroup.schedule_service.configuration.ScheduleEngineProperties;
import pe.albrugroup.schedule_service.entity.request.horario.AjusteJornadaRequest;
import pe.albrugroup.schedule_service.entity.response.horario.AjusteJornadaResponse;
import pe.albrugroup.schedule_service.entity.response.horario.JornadaEfectivaResponse;
import pe.albrugroup.schedule_service.entity.response.horario.PreviewAjusteJornadaResponse;
import pe.albrugroup.schedule_service.security.InternalRequestAuthorizer;
import pe.albrugroup.schedule_service.service.AjusteJornadaService;

import java.time.LocalDate;

@RestController
@Validated
@RequiredArgsConstructor
@RequestMapping("/horarios/internal/empleados/{idEmpleado}")
public class AjusteJornadaInternalController {

    private static final String SECRET_HEADER = "X-Internal-Secret";

    private final AjusteJornadaService service;
    private final InternalRequestAuthorizer internalRequestAuthorizer;
    private final ScheduleEngineProperties engineProperties;

    @GetMapping("/jornada-efectiva")
    @PreAuthorize("hasAuthority('EXTEND_HORARIO')")
    public ResponseEntity<JornadaEfectivaResponse> jornada(
            @RequestHeader(SECRET_HEADER) String internalSecret,
            @PathVariable @Positive Long idEmpleado,
            @RequestParam(required = false) LocalDate fecha
    ) {
        internalRequestAuthorizer.requireValidSecret(internalSecret);
        requireGtrEnabled();
        return ResponseEntity.ok(service.getJornada(idEmpleado, fecha));
    }

    @PostMapping("/ajustes/preview")
    @PreAuthorize("hasAuthority('EXTEND_HORARIO')")
    public ResponseEntity<PreviewAjusteJornadaResponse> preview(
            @RequestHeader(SECRET_HEADER) String internalSecret,
            @PathVariable @Positive Long idEmpleado,
            @Valid @RequestBody AjusteJornadaRequest request
    ) {
        internalRequestAuthorizer.requireValidSecret(internalSecret);
        requireGtrEnabled();
        return ResponseEntity.ok(service.preview(idEmpleado, request));
    }

    @PostMapping("/ajustes")
    @PreAuthorize("hasAuthority('EXTEND_HORARIO')")
    public ResponseEntity<AjusteJornadaResponse> registrar(
            @RequestHeader(SECRET_HEADER) String internalSecret,
            @PathVariable @Positive Long idEmpleado,
            @Valid @RequestBody AjusteJornadaRequest request
    ) {
        internalRequestAuthorizer.requireValidSecret(internalSecret);
        requireGtrEnabled();
        return ResponseEntity.status(HttpStatus.CREATED).body(service.registrar(idEmpleado, request));
    }

    private void requireGtrEnabled() {
        if (!engineProperties.enabledForGtrWrites()) {
            throw new pe.albrugroup.schedule_service.exception.BadRequestException(
                    "Los ajustes de jornada para GTR aun no estan habilitados"
            );
        }
    }
}
