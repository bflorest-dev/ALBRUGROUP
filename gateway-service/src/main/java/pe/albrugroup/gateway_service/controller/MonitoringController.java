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
}
