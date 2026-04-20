package pe.albrugroup.schedule_service.controller;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Positive;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import pe.albrugroup.schedule_service.entity.request.asistencia.ConsultaMonitoreoRequest;
import pe.albrugroup.schedule_service.entity.response.asistencia.DetalleAsistenciaResponse;
import pe.albrugroup.schedule_service.entity.response.asistencia.EstadoActualResponse;
import pe.albrugroup.schedule_service.entity.response.asistencia.EstadoMonitorResponse;
import pe.albrugroup.schedule_service.entity.response.asistencia.HistorialAsistenciaResponse;
import pe.albrugroup.schedule_service.entity.response.asistencia.ResumenAsistenciaResponse;
import pe.albrugroup.schedule_service.usecase.IAsistencia;

import java.time.LocalDate;
import java.util.List;

@RestController
@Validated
@RequiredArgsConstructor
@RequestMapping("/revision/asistencia")
public class RevisionController {

    private final IAsistencia asistenciaService;

    @GetMapping("/empleados/{idEmpleado}/estado-actual")
    @PreAuthorize("hasAuthority('READ_ASISTENCIAS')")
    public ResponseEntity<EstadoActualResponse> getEstadoActual(
            @PathVariable @Positive Long idEmpleado,
            @RequestParam(required = false) LocalDate fecha
    ) {
        return ResponseEntity.ok(asistenciaService.getEstadoActual(idEmpleado, fecha));
    }

    @GetMapping("/empleados/{idEmpleado}/dia")
    @PreAuthorize("hasAuthority('READ_ASISTENCIAS')")
    public ResponseEntity<DetalleAsistenciaResponse> getAsistenciaDia(
            @PathVariable @Positive Long idEmpleado,
            @RequestParam(required = false) LocalDate fecha
    ) {
        return ResponseEntity.ok(asistenciaService.getAsistenciaDia(idEmpleado, fecha != null ? fecha : LocalDate.now()));
    }

    @GetMapping("/empleados/{idEmpleado}/semana")
    @PreAuthorize("hasAuthority('READ_ASISTENCIAS')")
    public ResponseEntity<ResumenAsistenciaResponse> getResumenSemanal(
            @PathVariable @Positive Long idEmpleado,
            @RequestParam(required = false) LocalDate fecha
    ) {
        return ResponseEntity.ok(asistenciaService.getResumenSemanal(idEmpleado, fecha));
    }

    @GetMapping("/empleados/{idEmpleado}/mes")
    @PreAuthorize("hasAuthority('READ_ASISTENCIAS')")
    public ResponseEntity<ResumenAsistenciaResponse> getResumenMensual(
            @PathVariable @Positive Long idEmpleado,
            @RequestParam(required = false) LocalDate fecha
    ) {
        return ResponseEntity.ok(asistenciaService.getResumenMensual(idEmpleado, fecha));
    }

    @GetMapping("/empleados/{idEmpleado}/historial")
    @PreAuthorize("hasAuthority('READ_ASISTENCIAS')")
    public ResponseEntity<List<HistorialAsistenciaResponse>> getHistorial(
            @PathVariable @Positive Long idEmpleado,
            @RequestParam(required = false) LocalDate desde,
            @RequestParam(required = false) LocalDate hasta
    ) {
        return ResponseEntity.ok(asistenciaService.getHistorial(idEmpleado, desde, hasta));
    }

    @PostMapping("/monitor/estados")
    @PreAuthorize("hasAnyAuthority('READ_ASISTENCIAS','READ_LEADS_GTR','READ_LEADS_SUPERVISOR_VENTAS_RESUMEN','READ_EMPLEADOS')")
    public ResponseEntity<List<EstadoMonitorResponse>> getEstadosMonitor(@Valid @RequestBody ConsultaMonitoreoRequest request) {
        return ResponseEntity.ok(asistenciaService.getEstadosMonitor(request));
    }
}
