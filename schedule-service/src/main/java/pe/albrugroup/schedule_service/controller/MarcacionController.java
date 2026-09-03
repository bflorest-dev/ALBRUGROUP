package pe.albrugroup.schedule_service.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import jakarta.validation.constraints.Positive;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestBody;
import pe.albrugroup.schedule_service.configuration.CurrentUser;
import pe.albrugroup.schedule_service.configuration.OperationalDateTime;
import pe.albrugroup.schedule_service.entity.request.asistencia.AjustarAlmuerzoRequest;
import pe.albrugroup.schedule_service.entity.request.asistencia.IniciarAlmuerzoRequest;
import pe.albrugroup.schedule_service.entity.response.asistencia.DetalleDiaResponse;
import pe.albrugroup.schedule_service.entity.response.asistencia.ReporteDiaResponse;
import pe.albrugroup.schedule_service.service.MarcacionService;

import java.time.LocalDate;

/**
 * Marcacion nueva (rediseno). Convive con {@code AsistenciaController} (/asistencia) hasta el cutover.
 * El sufijo v2 se limpia en la fase final.
 */
@RestController
@Validated
@RequiredArgsConstructor
@RequestMapping("/asistencia/v2")
public class MarcacionController {

    private final MarcacionService marcacionService;
    private final CurrentUser currentUser;

    @GetMapping("/dia")
    @PreAuthorize("hasAuthority('READ_ASISTENCIAS_SELF')")
    public ResponseEntity<DetalleDiaResponse> getDia(@RequestParam(required = false) LocalDate fecha) {
        return ResponseEntity.ok(
                marcacionService.getDia(currentUser.empleadoID(), OperationalDateTime.resolveDate(fecha)));
    }

    /** Reporte por empleado/dia (admin/RRHH): tramos + sesiones + tiempos muertos + totales, para cualquier fecha. */
    @GetMapping("/reporte-dia/{idEmpleado}")
    @PreAuthorize("hasAuthority('READ_ASISTENCIAS_CUMPLIMIENTO')")
    public ResponseEntity<ReporteDiaResponse> getReporteDia(@PathVariable @Positive Long idEmpleado,
                                                            @RequestParam(required = false) LocalDate fecha) {
        return ResponseEntity.ok(
                marcacionService.getReporteDia(idEmpleado, OperationalDateTime.resolveDate(fecha)));
    }

    /**
     * Ajuste puntual del almuerzo programado de un dia (admin/RRHH): mover, habilitar o quitar la ventana de
     * almuerzo mientras el asesor aun no la marca. El almuerzo debe caer dentro del horario base.
     */
    @PatchMapping("/empleados/{idEmpleado}/almuerzo-programado")
    @PreAuthorize("hasAuthority('EXTEND_HORARIO')")
    public ResponseEntity<ReporteDiaResponse> ajustarAlmuerzo(@PathVariable @Positive Long idEmpleado,
                                                              @RequestParam(required = false) LocalDate fecha,
                                                              @RequestBody AjustarAlmuerzoRequest request) {
        return ResponseEntity.ok(marcacionService.ajustarAlmuerzoProgramado(
                idEmpleado, OperationalDateTime.resolveDate(fecha), request.inicio(), request.fin()));
    }

    @PostMapping("/ingreso")
    @PreAuthorize("hasAuthority('UPDATE_ASISTENCIAS')")
    public ResponseEntity<DetalleDiaResponse> registrarIngreso() {
        return ResponseEntity.ok(marcacionService.registrarIngreso());
    }

    @PostMapping("/salida")
    @PreAuthorize("hasAuthority('UPDATE_ASISTENCIAS')")
    public ResponseEntity<DetalleDiaResponse> registrarSalida() {
        return ResponseEntity.ok(marcacionService.registrarSalida());
    }

    // --- Estados cronometrados (self) ---

    @PostMapping("/servicios/inicio")
    @PreAuthorize("hasAuthority('UPDATE_ASISTENCIAS')")
    public ResponseEntity<DetalleDiaResponse> iniciarServicios() {
        return ResponseEntity.ok(marcacionService.iniciarServicios());
    }

    @PostMapping("/servicios/fin")
    @PreAuthorize("hasAuthority('UPDATE_ASISTENCIAS')")
    public ResponseEntity<DetalleDiaResponse> finalizarServicios() {
        return ResponseEntity.ok(marcacionService.finalizarServicios());
    }

    @PostMapping("/pausa-activa/inicio")
    @PreAuthorize("hasAuthority('UPDATE_ASISTENCIAS')")
    public ResponseEntity<DetalleDiaResponse> iniciarPausaActiva() {
        return ResponseEntity.ok(marcacionService.iniciarPausaActiva());
    }

    @PostMapping("/pausa-activa/fin")
    @PreAuthorize("hasAuthority('UPDATE_ASISTENCIAS')")
    public ResponseEntity<DetalleDiaResponse> finalizarPausaActiva() {
        return ResponseEntity.ok(marcacionService.finalizarPausaActiva());
    }

    // --- Almuerzo (estado vs. marcacion real) ---

    @PostMapping("/almuerzo/inicio")
    @PreAuthorize("hasAuthority('UPDATE_ASISTENCIAS')")
    public ResponseEntity<DetalleDiaResponse> iniciarAlmuerzo(
            @RequestBody(required = false) IniciarAlmuerzoRequest request) {
        return ResponseEntity.ok(marcacionService.iniciarAlmuerzo(request));
    }

    /** Senal "bandeja vacia": arranca el contador real del almuerzo si aun no empezo. */
    @PostMapping("/almuerzo/bandeja-vacia")
    @PreAuthorize("hasAuthority('UPDATE_ASISTENCIAS')")
    public ResponseEntity<DetalleDiaResponse> notificarBandejaVacia() {
        return ResponseEntity.ok(marcacionService.notificarBandejaVacia());
    }

    @PostMapping("/almuerzo/fin")
    @PreAuthorize("hasAuthority('UPDATE_ASISTENCIAS')")
    public ResponseEntity<DetalleDiaResponse> finalizarAlmuerzo() {
        return ResponseEntity.ok(marcacionService.finalizarAlmuerzo());
    }

    /** El propio asesor sale de CAPACITACION (volver a ONLINE); no puede activarla. */
    @PostMapping("/capacitacion/fin")
    @PreAuthorize("hasAuthority('UPDATE_ASISTENCIAS')")
    public ResponseEntity<DetalleDiaResponse> finalizarCapacitacionPropia() {
        return ResponseEntity.ok(marcacionService.finalizarCapacitacion(currentUser.empleadoID()));
    }

    // --- CAPACITACION gestionada por rol externo (supervisor/RRHH/etc con EXTEND_HORARIO) ---

    @PostMapping("/empleados/{idEmpleado}/capacitacion/inicio")
    @PreAuthorize("hasAuthority('EXTEND_HORARIO')")
    public ResponseEntity<DetalleDiaResponse> activarCapacitacion(@PathVariable @Positive Long idEmpleado) {
        return ResponseEntity.ok(marcacionService.activarCapacitacion(idEmpleado));
    }

    @PostMapping("/empleados/{idEmpleado}/capacitacion/fin")
    @PreAuthorize("hasAuthority('EXTEND_HORARIO')")
    public ResponseEntity<DetalleDiaResponse> finalizarCapacitacion(@PathVariable @Positive Long idEmpleado) {
        return ResponseEntity.ok(marcacionService.finalizarCapacitacion(idEmpleado));
    }
}
