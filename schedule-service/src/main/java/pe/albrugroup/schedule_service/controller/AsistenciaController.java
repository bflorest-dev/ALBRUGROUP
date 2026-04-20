package pe.albrugroup.schedule_service.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import pe.albrugroup.schedule_service.entity.request.asistencia.MovimientoAsistenciaRequest;
import pe.albrugroup.schedule_service.entity.response.asistencia.DetalleAsistenciaResponse;
import pe.albrugroup.schedule_service.entity.response.asistencia.EstadoActualResponse;
import pe.albrugroup.schedule_service.entity.response.asistencia.HistorialAsistenciaResponse;
import pe.albrugroup.schedule_service.entity.response.asistencia.ResumenAsistenciaResponse;
import pe.albrugroup.schedule_service.usecase.IAsistencia;

import java.time.LocalDate;
import java.util.List;

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

    @GetMapping("/estado-actual")
    @PreAuthorize("hasAuthority('READ_ASISTENCIAS_SELF')")
    public ResponseEntity<EstadoActualResponse> getEstadoActual(@RequestParam(required = false) LocalDate fecha) {
        return ResponseEntity.ok(asistenciaService.getEstadoActual(fecha));
    }

    @GetMapping("/dia")
    @PreAuthorize("hasAuthority('READ_ASISTENCIAS_SELF')")
    public ResponseEntity<DetalleAsistenciaResponse> getAsistenciaDia(@RequestParam(required = false) LocalDate fecha) {
        return ResponseEntity.ok(asistenciaService.getAsistenciaDia(fecha != null ? fecha : LocalDate.now()));
    }

    @GetMapping("/semana")
    @PreAuthorize("hasAuthority('READ_ASISTENCIAS_SELF')")
    public ResponseEntity<ResumenAsistenciaResponse> getResumenSemanal(@RequestParam(required = false) LocalDate fecha) {
        return ResponseEntity.ok(asistenciaService.getResumenSemanal(fecha));
    }

    @GetMapping("/mes")
    @PreAuthorize("hasAuthority('READ_ASISTENCIAS_SELF')")
    public ResponseEntity<ResumenAsistenciaResponse> getResumenMensual(@RequestParam(required = false) LocalDate fecha) {
        return ResponseEntity.ok(asistenciaService.getResumenMensual(fecha));
    }

    @GetMapping("/historial")
    @PreAuthorize("hasAuthority('READ_ASISTENCIAS_SELF')")
    public ResponseEntity<List<HistorialAsistenciaResponse>> getHistorial(@RequestParam(required = false) LocalDate desde,
                                                                          @RequestParam(required = false) LocalDate hasta) {
        return ResponseEntity.ok(asistenciaService.getHistorial(desde, hasta));
    }
}
