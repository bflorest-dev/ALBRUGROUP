package pe.albrugroup.gateway_service.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import pe.albrugroup.gateway_service.entity.enums.PuestoTrabajo;
import pe.albrugroup.gateway_service.entity.response.AsesorGtrResponse;
import pe.albrugroup.gateway_service.entity.response.AsesorSupervisorResponse;
import pe.albrugroup.gateway_service.entity.response.ConnectedUserResponse;
import pe.albrugroup.gateway_service.entity.response.EmpleadoEsperadoResponse;
import pe.albrugroup.gateway_service.integration.auth.AuthMonitoringClient;
import pe.albrugroup.gateway_service.integration.auth.dto.UsuarioRolResponse;
import pe.albrugroup.gateway_service.integration.schedule.ScheduleMonitoringClient;
import pe.albrugroup.gateway_service.integration.schedule.dto.EstadoMonitorResponse;
import pe.albrugroup.gateway_service.presence.PresenceService;
import reactor.core.publisher.Mono;

import java.time.LocalDate;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MonitoringService {

    private static final PuestoTrabajo ROL_ASESOR = PuestoTrabajo.ASESOR_VENTAS;

    private final PresenceService presenceService;
    private final ScheduleMonitoringClient scheduleMonitoringClient;
    private final AuthMonitoringClient authMonitoringClient;

    public Mono<List<AsesorGtrResponse>> listarAsesoresConectadosGtr(String authHeader, LocalDate fecha) {
        return presenceService.listarUsuariosConectados(ROL_ASESOR)
                .flatMap(conectados -> consultarEstados(authHeader, connectedIds(conectados), fecha)
                        .map(estados -> conectados.stream()
                                .map(conectado -> toGtrResponse(conectado, estados.get(conectado.getEmpleadoId())))
                                .sorted(Comparator.comparing(AsesorGtrResponse::getNombreCompleto, String.CASE_INSENSITIVE_ORDER))
                                .toList()));
    }

    public Mono<List<AsesorSupervisorResponse>> listarAsesoresConectadosSupervisor(String authHeader, LocalDate fecha) {
        return presenceService.listarUsuariosConectados(ROL_ASESOR)
                .flatMap(conectados -> consultarEstados(authHeader, connectedIds(conectados), fecha)
                        .map(estados -> conectados.stream()
                                .map(conectado -> toSupervisorResponse(conectado, estados.get(conectado.getEmpleadoId())))
                                .sorted(Comparator.comparing(AsesorSupervisorResponse::getNombreCompleto, String.CASE_INSENSITIVE_ORDER))
                                .toList()));
    }

    public Mono<List<EmpleadoEsperadoResponse>> listarAsesoresEsperadosNoConectados(String authHeader, LocalDate fecha) {
        Mono<List<UsuarioRolResponse>> asesoresMono = authMonitoringClient.listarUsuariosActivosPorRol(authHeader, ROL_ASESOR);
        Mono<List<ConnectedUserResponse>> conectadosMono = presenceService.listarUsuariosConectados(ROL_ASESOR);

        return Mono.zip(asesoresMono, conectadosMono)
                .flatMap(tuple -> {
                    List<UsuarioRolResponse> asesores = tuple.getT1();
                    List<ConnectedUserResponse> conectados = tuple.getT2();
                    Set<Long> conectadosIds = connectedIds(conectados);
                    Set<Long> asesorIds = asesores.stream()
                            .map(UsuarioRolResponse::getEmpleadoId)
                            .collect(Collectors.toSet());

                    return consultarEstados(authHeader, asesorIds, fecha)
                            .map(estados -> asesores.stream()
                                    .map(asesor -> toEsperadoResponse(asesor, estados.get(asesor.getEmpleadoId()), conectadosIds.contains(asesor.getEmpleadoId())))
                                    .filter(response -> response.isEsperadoHoy() && !response.isConectado())
                                    .sorted(Comparator.comparing(EmpleadoEsperadoResponse::getNombreCompleto, String.CASE_INSENSITIVE_ORDER))
                                    .toList());
                });
    }

    private Mono<Map<Long, EstadoMonitorResponse>> consultarEstados(String authHeader, Set<Long> empleadoIds, LocalDate fecha) {
        if (empleadoIds.isEmpty()) {
            return Mono.just(Map.of());
        }

        return scheduleMonitoringClient.consultarEstadosMonitor(authHeader, List.copyOf(empleadoIds), fecha)
                .map(estados -> estados.stream()
                        .collect(Collectors.toMap(
                                EstadoMonitorResponse::getIdEmpleado,
                                estado -> estado,
                                (left, right) -> left,
                                LinkedHashMap::new
                        )));
    }

    private Set<Long> connectedIds(List<ConnectedUserResponse> conectados) {
        return conectados.stream()
                .map(ConnectedUserResponse::getEmpleadoId)
                .collect(Collectors.toSet());
    }

    private AsesorGtrResponse toGtrResponse(ConnectedUserResponse conectado, EstadoMonitorResponse estado) {
        EstadoMonitorResponse monitor = defaultEstado(conectado.getEmpleadoId(), estado);
        return AsesorGtrResponse.builder()
                .empleadoId(conectado.getEmpleadoId())
                .nombreCompleto(conectado.getNombreCompleto())
                .disponibilidad(conectado.getDisponibilidad())
                .lastSeen(conectado.getLastSeen())
                .estadoSchedule(monitor.getEstadoActual())
                .desde(monitor.getDesde())
                .esperadoHoy(Boolean.TRUE.equals(monitor.getEsperadoHoy()))
                .operativo(Boolean.TRUE.equals(monitor.getOperativo()))
                .build();
    }

    private AsesorSupervisorResponse toSupervisorResponse(ConnectedUserResponse conectado, EstadoMonitorResponse estado) {
        EstadoMonitorResponse monitor = defaultEstado(conectado.getEmpleadoId(), estado);
        return AsesorSupervisorResponse.builder()
                .empleadoId(conectado.getEmpleadoId())
                .nombreCompleto(conectado.getNombreCompleto())
                .roles(conectado.getRoles())
                .disponibilidad(conectado.getDisponibilidad())
                .disponibilidadDesde(conectado.getDisponibilidadDesde())
                .lastSeen(conectado.getLastSeen())
                .estadoSchedule(monitor.getEstadoActual())
                .desde(monitor.getDesde())
                .entradaProgramada(monitor.getEntradaProgramada())
                .esperadoHoy(Boolean.TRUE.equals(monitor.getEsperadoHoy()))
                .tieneRegistroHoy(Boolean.TRUE.equals(monitor.getTieneRegistroHoy()))
                .operativo(Boolean.TRUE.equals(monitor.getOperativo()))
                .minutosServiciosEnCurso(monitor.getMinutosServiciosEnCurso())
                .minutosServiciosAcumulados(monitor.getMinutosServiciosAcumulados())
                .minutosServiciosPermitidos(monitor.getMinutosServiciosPermitidos())
                .excedioServicios(monitor.getExcedioServicios())
                .build();
    }

    private EmpleadoEsperadoResponse toEsperadoResponse(UsuarioRolResponse asesor, EstadoMonitorResponse estado, boolean conectado) {
        EstadoMonitorResponse monitor = defaultEstado(asesor.getEmpleadoId(), estado);
        return EmpleadoEsperadoResponse.builder()
                .empleadoId(asesor.getEmpleadoId())
                .nombreCompleto(asesor.getNombreCompleto())
                .roles(asesor.getRoles())
                .fecha(monitor.getFecha())
                .entradaProgramada(monitor.getEntradaProgramada())
                .conectado(conectado)
                .tieneHorarioVigente(Boolean.TRUE.equals(monitor.getTieneHorarioVigente()))
                .laborableHoy(Boolean.TRUE.equals(monitor.getLaborableHoy()))
                .esperadoHoy(Boolean.TRUE.equals(monitor.getEsperadoHoy()))
                .tieneRegistroHoy(Boolean.TRUE.equals(monitor.getTieneRegistroHoy()))
                .estadoSchedule(monitor.getEstadoActual())
                .build();
    }

    private EstadoMonitorResponse defaultEstado(Long empleadoId, EstadoMonitorResponse estado) {
        if (estado != null) {
            return estado;
        }

        EstadoMonitorResponse fallback = new EstadoMonitorResponse();
        fallback.setIdEmpleado(empleadoId);
        fallback.setEstadoActual("OFFLINE");
        fallback.setEsperadoHoy(false);
        fallback.setLaborableHoy(false);
        fallback.setTieneHorarioVigente(false);
        fallback.setTieneRegistroHoy(false);
        fallback.setOperativo(false);
        fallback.setMinutosServiciosAcumulados(0);
        fallback.setMinutosServiciosEnCurso(0);
        fallback.setMinutosServiciosPermitidos(0);
        fallback.setExcedioServicios(false);
        return fallback;
    }
}
