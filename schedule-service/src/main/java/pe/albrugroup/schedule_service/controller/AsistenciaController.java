package pe.albrugroup.schedule_service.controller;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import pe.albrugroup.schedule_service.configuration.OperationalDateTime;
import pe.albrugroup.schedule_service.entity.request.asistencia.MovimientoAsistenciaRequest;
import pe.albrugroup.schedule_service.entity.response.asistencia.AsistenciaMesResponse;
import pe.albrugroup.schedule_service.entity.response.asistencia.DetalleAsistenciaResponse;
import pe.albrugroup.schedule_service.usecase.IAsistencia;

import java.time.LocalDate;

@RestController
@Validated
@RequiredArgsConstructor
@RequestMapping("/asistencia")
public class AsistenciaController {

    private final IAsistencia asistenciaService;

    @PostMapping("/ingreso")
    @PreAuthorize("hasAuthority('UPDATE_ASISTENCIAS')")
    public ResponseEntity<DetalleAsistenciaResponse> registrarIngreso(@Valid @RequestBody MovimientoAsistenciaRequest request) {
        return ResponseEntity.ok(asistenciaService.registrarIngreso(request));
    }

    @PostMapping("/salida")
    @PreAuthorize("hasAuthority('UPDATE_ASISTENCIAS')")
    public ResponseEntity<DetalleAsistenciaResponse> registrarSalida(@Valid @RequestBody MovimientoAsistenciaRequest request) {
        return ResponseEntity.ok(asistenciaService.registrarSalida(request));
    }

    @PostMapping("/almuerzo/inicio")
    @PreAuthorize("hasAuthority('UPDATE_ASISTENCIAS')")
    public ResponseEntity<DetalleAsistenciaResponse> iniciarAlmuerzo(@Valid @RequestBody MovimientoAsistenciaRequest request) {
        return ResponseEntity.ok(asistenciaService.iniciarAlmuerzo(request));
    }

    @PostMapping("/almuerzo/fin")
    @PreAuthorize("hasAuthority('UPDATE_ASISTENCIAS')")
    public ResponseEntity<DetalleAsistenciaResponse> finalizarAlmuerzo(@Valid @RequestBody MovimientoAsistenciaRequest request) {
        return ResponseEntity.ok(asistenciaService.finalizarAlmuerzo(request));
    }

    @PostMapping("/servicios/inicio")
    @PreAuthorize("hasAuthority('UPDATE_ASISTENCIAS')")
    public ResponseEntity<DetalleAsistenciaResponse> iniciarServicios(@Valid @RequestBody MovimientoAsistenciaRequest request) {
        return ResponseEntity.ok(asistenciaService.iniciarServicios(request));
    }

    @PostMapping("/servicios/fin")
    @PreAuthorize("hasAuthority('UPDATE_ASISTENCIAS')")
    public ResponseEntity<DetalleAsistenciaResponse> finalizarServicios(@Valid @RequestBody MovimientoAsistenciaRequest request) {
        return ResponseEntity.ok(asistenciaService.finalizarServicios(request));
    }

    @GetMapping("/dia")
    @PreAuthorize("hasAuthority('READ_ASISTENCIAS_SELF')")
    public ResponseEntity<DetalleAsistenciaResponse> getAsistenciaDia(@RequestParam(required = false) LocalDate fecha) {
        return ResponseEntity.ok(asistenciaService.getAsistenciaDia(OperationalDateTime.resolveDate(fecha)));
    }

    @GetMapping("/mes")
    @PreAuthorize("hasAuthority('READ_ASISTENCIAS_SELF')")
    public ResponseEntity<AsistenciaMesResponse> getAsistenciaMes(
            @RequestParam(required = false) Integer anio,
            @RequestParam(required = false) @Min(1) @Max(12) Integer mes
    ) {
        return ResponseEntity.ok(asistenciaService.getAsistenciaMes(anio, mes));
    }
}
