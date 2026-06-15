package pe.albrugroup.gateway_service.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import pe.albrugroup.gateway_service.entity.response.AsesorGtrResponse;
import pe.albrugroup.gateway_service.entity.response.AsesorSupervisorResponse;
import pe.albrugroup.gateway_service.entity.response.EmpleadoEsperadoResponse;
import pe.albrugroup.gateway_service.service.MonitoringService;
import reactor.core.publisher.Mono;

import java.time.LocalDate;
import java.util.List;
import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

@RestController
@RequiredArgsConstructor
@RequestMapping("/monitor")
@Tag(name = "Monitoreo Operativo", description = "Dashboard operativo enriquecido con presencia en Redis y estados de schedule")
public class MonitoringController {

    private final MonitoringService monitoringService;

    @GetMapping("/gtr/asesores-ventas/conectados")
    @PreAuthorize("hasAuthority('READ_LEADS_GTR')")
    @Operation(summary = "Listar asesores conectados para GTR", description = "Devuelve asesores de ventas conectados con un enriquecimiento ligero del estado operativo.")
    public Mono<ResponseEntity<List<AsesorGtrResponse>>> listarAsesoresConectadosGtr(
            @RequestHeader(HttpHeaders.AUTHORIZATION) String authHeader,
            @RequestParam(required = false) LocalDate fecha
    ) {
        return monitoringService.listarAsesoresConectadosGtr(authHeader, fecha)
                .map(ResponseEntity::ok);
    }

    @GetMapping("/supervisor-ventas/asesores-ventas/conectados")
    @PreAuthorize("hasAuthority('READ_LEADS_SUPERVISOR_VENTAS_RESUMEN')")
    @Operation(summary = "Listar asesores conectados para supervisor", description = "Devuelve asesores de ventas conectados con su estado operativo actual y datos de supervisión.")
    public Mono<ResponseEntity<List<AsesorSupervisorResponse>>> listarAsesoresConectadosSupervisor(
            @RequestHeader(HttpHeaders.AUTHORIZATION) String authHeader,
            @RequestParam(required = false) LocalDate fecha
    ) {
        return monitoringService.listarAsesoresConectadosSupervisor(authHeader, fecha)
                .map(ResponseEntity::ok);
    }

    @GetMapping("/supervisor-ventas/asesores-ventas/esperados-no-conectados")
    @PreAuthorize("hasAuthority('READ_LEADS_SUPERVISOR_VENTAS_RESUMEN')")
    @Operation(summary = "Listar asesores esperados no conectados", description = "Cruza asesores activos por rol, expectativa laboral del día y presencia Redis para detectar ausentes en línea.")
    public Mono<ResponseEntity<List<EmpleadoEsperadoResponse>>> listarAsesoresEsperadosNoConectados(
            @RequestHeader(HttpHeaders.AUTHORIZATION) String authHeader,
            @RequestParam(required = false) LocalDate fecha
    ) {
        return monitoringService.listarAsesoresEsperadosNoConectados(authHeader, fecha)
                .map(ResponseEntity::ok);
    }

    @GetMapping("/gtr/asesores-ventas/{idEmpleado}/jornada-efectiva")
    @PreAuthorize("hasAuthority('EXTEND_HORARIO')")
    public Mono<ResponseEntity<JsonNode>> getJornadaAjustableGtr(
            @RequestHeader(HttpHeaders.AUTHORIZATION) String authHeader,
            @PathVariable Long idEmpleado,
            @RequestParam(required = false) LocalDate fecha
    ) {
        LocalDate consulta = fecha == null
                ? LocalDate.now(java.time.ZoneId.of("America/Lima"))
                : fecha;
        return monitoringService.getJornadaAjustableGtr(authHeader, idEmpleado, consulta)
                .map(ResponseEntity::ok);
    }

    @PostMapping("/gtr/asesores-ventas/{idEmpleado}/ajustes/preview")
    @PreAuthorize("hasAuthority('EXTEND_HORARIO')")
    public Mono<ResponseEntity<JsonNode>> previewAjusteGtr(
            @RequestHeader(HttpHeaders.AUTHORIZATION) String authHeader,
            @PathVariable Long idEmpleado,
            @RequestBody JsonNode request
    ) {
        return monitoringService.previewAjusteGtr(authHeader, idEmpleado, request)
                .map(ResponseEntity::ok);
    }

    @PostMapping("/gtr/asesores-ventas/{idEmpleado}/ajustes")
    @PreAuthorize("hasAuthority('EXTEND_HORARIO')")
    public Mono<ResponseEntity<JsonNode>> registrarAjusteGtr(
            @RequestHeader(HttpHeaders.AUTHORIZATION) String authHeader,
            @PathVariable Long idEmpleado,
            @RequestBody JsonNode request
    ) {
        return monitoringService.registrarAjusteGtr(authHeader, idEmpleado, request)
                .map(response -> ResponseEntity.status(201).body(response));
    }
}
