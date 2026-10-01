package pe.albrugroup.schedule_service.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import pe.albrugroup.schedule_service.entity.request.asistencia.PresenciaEventoRequest;
import pe.albrugroup.schedule_service.entity.request.asistencia.BillingIncidenciasRequest;
import pe.albrugroup.schedule_service.entity.response.asistencia.BillingEmpleadoIncidenciasResponse;
import pe.albrugroup.schedule_service.entity.response.asistencia.DetalleAsistenciaResponse;
import pe.albrugroup.schedule_service.service.BillingIncidenciasService;
import pe.albrugroup.schedule_service.service.PresenciaTramoService;
import pe.albrugroup.schedule_service.usecase.IAsistencia;

import java.util.List;

/**
 * Endpoints internos service-to-service (no expuestos al usuario final). Los consume el job de
 * reconciliacion del gateway para cerrar jornadas de empleados que ya no estan conectados y cuyo
 * horario termino. Se protegen con un secreto compartido (ver InternalAuthFilter), no con JWT.
 */
@RestController
@RequiredArgsConstructor
@RequestMapping("/asistencia/internal")
public class AsistenciaInternalController {

    private final IAsistencia asistenciaService;
    private final PresenciaTramoService presenciaTramoService;
    private final BillingIncidenciasService billingIncidenciasService;

    @GetMapping("/jornadas-abiertas-vencidas")
    @PreAuthorize("hasAuthority('SERVICE_INTERNAL')")
    public ResponseEntity<List<Long>> jornadasAbiertasVencidas() {
        return ResponseEntity.ok(asistenciaService.listarEmpleadosJornadaAbiertaVencida());
    }

    @PostMapping("/auto-cierre/{empleadoId}")
    @PreAuthorize("hasAuthority('SERVICE_INTERNAL')")
    public ResponseEntity<DetalleAsistenciaResponse> autoCierre(@PathVariable Long empleadoId) {
        return ResponseEntity.ok(asistenciaService.autoCerrarJornada(empleadoId));
    }

    @PostMapping("/presencia-evento")
    @PreAuthorize("hasAuthority('SERVICE_INTERNAL')")
    public ResponseEntity<Void> registrarPresenciaEvento(@RequestBody PresenciaEventoRequest request) {
        presenciaTramoService.procesarEvento(request);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/billing/incidencias-mensuales")
    @PreAuthorize("hasAuthority('SERVICE_INTERNAL')")
    public ResponseEntity<List<BillingEmpleadoIncidenciasResponse>> obtenerIncidenciasBilling(
            @Valid @RequestBody BillingIncidenciasRequest request
    ) {
        return ResponseEntity.ok(
                billingIncidenciasService.obtenerIncidencias(request.anio(), request.mes(), request.empleados())
        );
    }
}
