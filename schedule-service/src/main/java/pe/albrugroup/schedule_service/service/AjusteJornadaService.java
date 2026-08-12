package pe.albrugroup.schedule_service.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.albrugroup.schedule_service.configuration.CurrentUser;
import pe.albrugroup.schedule_service.configuration.ScheduleEngineProperties;
import pe.albrugroup.schedule_service.entity.AjusteJornada;
import pe.albrugroup.schedule_service.entity.Asistencia;
import pe.albrugroup.schedule_service.entity.Horario;
import pe.albrugroup.schedule_service.entity.enums.EstadoAjusteJornada;
import pe.albrugroup.schedule_service.entity.enums.OrigenAjusteJornada;
import pe.albrugroup.schedule_service.entity.enums.RazonAjuste;
import pe.albrugroup.schedule_service.entity.request.horario.AjusteJornadaRequest;
import pe.albrugroup.schedule_service.entity.request.horario.RegistrarAjusteRequest;
import pe.albrugroup.schedule_service.entity.response.horario.*;
import pe.albrugroup.schedule_service.exception.BadRequestException;
import pe.albrugroup.schedule_service.exception.NotFoundException;
import pe.albrugroup.schedule_service.repository.AjusteJornadaRepository;
import pe.albrugroup.schedule_service.repository.AsistenciaRepository;
import pe.albrugroup.schedule_service.repository.HorarioRepository;

import java.time.Clock;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AjusteJornadaService {

    private final AjusteJornadaRepository ajusteRepository;
    private final HorarioRepository horarioRepository;
    private final AsistenciaRepository asistenciaRepository;
    private final JornadaEfectivaResolver jornadaResolver;
    private final AttendanceRealtimeNotifier realtimeNotifier;
    private final CurrentUser currentUser;
    private final ScheduleEngineProperties properties;
    private final Clock operationalClock;

    @Transactional(readOnly = true)
    public JornadaEfectivaResponse getJornada(Long idEmpleado, LocalDate fecha) {
        return jornadaResolver.resolver(idEmpleado, fecha == null ? LocalDate.now(operationalClock) : fecha);
    }

    @Transactional(readOnly = true)
    public PreviewAjusteJornadaResponse preview(Long idEmpleado, AjusteJornadaRequest request) {
        ValidatedAdjustment validated = validarYNormalizar(idEmpleado, request);
        List<AjusteJornada> activos = ajusteRepository
                .findByIdEmpleadoAndFechaOperativaAndEstadoOrderByInicioAsc(
                        idEmpleado, validated.fecha(), EstadoAjusteJornada.ACTIVO);
        return construirPreview(idEmpleado, request, validated, activos);
    }

    @Transactional
    public AjusteJornadaResponse registrar(Long idEmpleado, AjusteJornadaRequest request) {
        if (!properties.enabledForNewWrites()) {
            throw new BadRequestException("El nuevo registro de ajustes aun no esta habilitado");
        }
        ValidatedAdjustment validated = validarYNormalizar(idEmpleado, request);
        horarioRepository.findByIdForUpdate(validated.horario().getId())
                .orElseThrow(() -> new NotFoundException(Horario.class, validated.horario().getId()));
        List<AjusteJornada> activos = ajusteRepository
                .findForUpdateByIdEmpleadoAndFechaOperativaAndEstado(
                        idEmpleado, validated.fecha(), EstadoAjusteJornada.ACTIVO);
        List<AjusteJornada> reemplazados = activos.stream()
                .filter(item -> JornadaEfectivaResolver.overlaps(
                        item.getInicio(), item.getFin(), validated.inicio(), validated.fin()))
                .toList();

        AjusteJornada nuevo = ajusteRepository.save(AjusteJornada.builder()
                .idEmpleado(idEmpleado)
                .horario(validated.horario())
                .fechaOperativa(validated.fecha())
                .inicio(validated.inicio())
                .fin(validated.fin())
                .estado(EstadoAjusteJornada.ACTIVO)
                .origen(validated.origen())
                .motivo(request.getMotivo().trim())
                .creadoPor(currentUser.empleadoID())
                .build());

        reemplazados.forEach(anterior -> {
            anterior.setEstado(EstadoAjusteJornada.REEMPLAZADO);
            anterior.setReemplazadoPor(nuevo);
        });
        ajusteRepository.saveAll(reemplazados);
        actualizarTramoActivo(idEmpleado, validated);
        publicarCambio(idEmpleado, validated.fecha());
        return toResponse(nuevo);
    }

    /**
     * Registro de ajuste v2: con RAZON explicita + autorizacion fina (rol + razon + limite). Convive con
     * {@link #registrar}. La mecanica (origen, overlap-replace) se reusa; se agrega razon y rolAutor.
     * El efecto en la marcacion (refresco de snapshot / horas extra) se maneja en 3.2.b.
     */
    @Transactional
    public AjusteJornadaResponse registrarV2(Long idEmpleado, RegistrarAjusteRequest request) {
        AjusteJornadaRequest base = AjusteJornadaRequest.builder()
                .inicio(request.getInicio()).fin(request.getFin()).motivo(request.getMotivo()).build();
        ValidatedAdjustment validated = validarYNormalizar(idEmpleado, base);

        // Desplazamiento del base (para el limite del corrimiento por supervisor).
        JornadaEfectivaResolver.BaseDiaria baseDiaria = jornadaResolver.resolverBase(validated.horario(), validated.fecha());
        long desplazamientoMin = baseDiaria.laborable() && baseDiaria.inicio() != null
                ? Math.abs(Duration.between(baseDiaria.inicio(), validated.inicio()).toMinutes())
                : 0;
        validarAutorizacionAjuste(request.getRazon(), currentUser.roles(), desplazamientoMin);

        horarioRepository.findByIdForUpdate(validated.horario().getId())
                .orElseThrow(() -> new NotFoundException(Horario.class, validated.horario().getId()));
        List<AjusteJornada> activos = ajusteRepository
                .findForUpdateByIdEmpleadoAndFechaOperativaAndEstado(
                        idEmpleado, validated.fecha(), EstadoAjusteJornada.ACTIVO);
        List<AjusteJornada> reemplazados = activos.stream()
                .filter(item -> JornadaEfectivaResolver.overlaps(
                        item.getInicio(), item.getFin(), validated.inicio(), validated.fin()))
                .toList();

        AjusteJornada nuevo = ajusteRepository.save(AjusteJornada.builder()
                .idEmpleado(idEmpleado)
                .horario(validated.horario())
                .fechaOperativa(validated.fecha())
                .inicio(validated.inicio())
                .fin(validated.fin())
                .estado(EstadoAjusteJornada.ACTIVO)
                .origen(validated.origen())
                .razon(request.getRazon())
                .rolAutor(rolPrincipal(currentUser.roles()))
                .motivo(request.getMotivo().trim())
                .creadoPor(currentUser.empleadoID())
                .build());

        reemplazados.forEach(anterior -> {
            anterior.setEstado(EstadoAjusteJornada.REEMPLAZADO);
            anterior.setReemplazadoPor(nuevo);
        });
        ajusteRepository.saveAll(reemplazados);
        publicarCambio(idEmpleado, validated.fecha());
        return toResponse(nuevo);
    }

    /**
     * Autorizacion fina por razon (Fork 6): el permiso grueso EXTEND_HORARIO ya se valido en el
     * controller; aqui se aplican las reglas de rol + limite que un permiso booleano no expresa.
     */
    private void validarAutorizacionAjuste(RazonAjuste razon, List<String> roles, long desplazamientoMin) {
        boolean admin = roles.contains("ADMINISTRADOR");
        switch (razon) {
            case AMPLIACION_OPERATIVA -> { /* cualquiera con EXTEND_HORARIO */ }
            case CORRIMIENTO_COMPENSADA -> {
                if (admin) {
                    return;
                }
                boolean supervisor = roles.contains("SUPERVISOR_VENTAS") || roles.contains("SUPERVISOR_GTR");
                if (!supervisor) {
                    throw new BadRequestException("Solo un supervisor o el administrador pueden aplicar una tardanza compensada");
                }
                if (desplazamientoMin > 60) {
                    throw new BadRequestException("Un supervisor solo puede desplazar el horario hasta 1 hora; para más, requiere al administrador");
                }
            }
            case CORRIMIENTO_JUSTIFICADA -> {
                if (!admin && !roles.contains("RRHH")) {
                    throw new BadRequestException("Solo RRHH puede aplicar una tardanza justificada");
                }
            }
            case COMPENSACION ->
                    throw new BadRequestException("La compensación de horas se gestiona en el cierre mensual");
        }
    }

    private String rolPrincipal(List<String> roles) {
        return roles == null || roles.isEmpty() ? null : roles.getFirst();
    }

    @Transactional(readOnly = true)
    public List<AjusteJornadaResponse> listar(Long idEmpleado, LocalDate fecha) {
        LocalDate consulta = fecha == null ? LocalDate.now(operationalClock) : fecha;
        return ajusteRepository.findByIdEmpleadoAndFechaOperativaOrderByCreatedAtDesc(idEmpleado, consulta)
                .stream().map(this::toResponse).toList();
    }

    @Transactional
    public AjusteJornadaResponse cancelar(Long idEmpleado, Long idAjuste) {
        AjusteJornada ajuste = ajusteRepository.findByIdAndIdEmpleado(idAjuste, idEmpleado)
                .orElseThrow(() -> new NotFoundException(AjusteJornada.class, idAjuste));
        if (ajuste.getEstado() != EstadoAjusteJornada.ACTIVO) {
            throw new BadRequestException("El ajuste ya no esta activo");
        }
        Asistencia asistencia = asistenciaRepository
                .findByIdEmpleadoAndFecha(idEmpleado, ajuste.getFechaOperativa()).orElse(null);
        if (asistencia != null && asistencia.getFechaHoraIngreso() != null
                && asistencia.getFechaHoraSalida() == null
                && JornadaEfectivaResolver.overlaps(
                ajuste.getInicio(), ajuste.getFin(),
                LocalDateTime.of(ajuste.getFechaOperativa(), asistencia.getEntradaProgramada()),
                LocalDateTime.of(ajuste.getFechaOperativa(), asistencia.getSalidaProgramada()))) {
            throw new BadRequestException("No se puede cancelar el tramo que el empleado esta trabajando");
        }
        ajuste.setEstado(EstadoAjusteJornada.CANCELADO);
        AjusteJornada saved = ajusteRepository.save(ajuste);
        publicarCambio(idEmpleado, ajuste.getFechaOperativa());
        return toResponse(saved);
    }

    private PreviewAjusteJornadaResponse construirPreview(
            Long idEmpleado,
            AjusteJornadaRequest request,
            ValidatedAdjustment validated,
            List<AjusteJornada> activos
    ) {
        JornadaEfectivaResponse anterior = jornadaResolver.resolver(
                validated.horario(), validated.fecha(), activos);
        List<Long> reemplazados = activos.stream()
                .filter(item -> JornadaEfectivaResolver.overlaps(
                        item.getInicio(), item.getFin(), validated.inicio(), validated.fin()))
                .map(AjusteJornada::getId)
                .toList();
        List<AjusteJornada> simulados = new ArrayList<>(activos.stream()
                .filter(item -> !reemplazados.contains(item.getId())).toList());
        simulados.add(AjusteJornada.builder()
                .idEmpleado(idEmpleado)
                .fechaOperativa(validated.fecha())
                .inicio(validated.inicio())
                .fin(validated.fin())
                .origen(validated.origen())
                .estado(EstadoAjusteJornada.ACTIVO)
                .motivo(request.getMotivo().trim())
                .build());
        simulados.sort(Comparator.comparing(AjusteJornada::getInicio));

        return PreviewAjusteJornadaResponse.builder()
                .idEmpleado(idEmpleado)
                .inicioSolicitado(request.getInicio())
                .finSolicitado(request.getFin())
                .inicioAplicado(validated.inicio())
                .finAplicado(validated.fin())
                .resultado(validated.origen().name())
                .normalizacion(validated.normalizacion())
                .ajustesReemplazados(reemplazados)
                .jornadaAnterior(anterior)
                .jornadaResultante(jornadaResolver.resolver(validated.horario(), validated.fecha(), simulados))
                .build();
    }

    private ValidatedAdjustment validarYNormalizar(Long idEmpleado, AjusteJornadaRequest request) {
        LocalDateTime inicio = request.getInicio();
        LocalDateTime fin = request.getFin();
        if (!inicio.toLocalDate().equals(fin.toLocalDate())) {
            throw new BadRequestException("Por ahora el inicio y fin deben pertenecer al mismo dia");
        }
        if (!fin.isAfter(inicio)) {
            throw new BadRequestException("La hora de fin debe ser posterior a la hora de inicio");
        }
        LocalDate hoy = LocalDate.now(operationalClock);
        LocalDate fecha = inicio.toLocalDate();
        if (fecha.isBefore(hoy)) {
            throw new BadRequestException("Solo se pueden registrar ajustes para hoy o una fecha futura");
        }
        if (fecha.isBefore(properties.getEffectiveFrom())) {
            throw new BadRequestException("La fecha es anterior al inicio del nuevo sistema de jornadas");
        }

        Horario horario = horarioRepository.findHorarioVigente(idEmpleado, fecha)
                .orElseThrow(() -> new NotFoundException("Horario vigente no encontrado", idEmpleado));
        JornadaEfectivaResolver.BaseDiaria base = jornadaResolver.resolverBase(horario, fecha);
        OrigenAjusteJornada origen = !base.laborable()
                ? OrigenAjusteJornada.JORNADA_EXTRAORDINARIA
                : JornadaEfectivaResolver.overlaps(inicio, fin, base.inicio(), base.fin())
                ? OrigenAjusteJornada.REEMPLAZO_BASE
                : OrigenAjusteJornada.TRAMO_ADICIONAL;

        String normalizacion = null;
        Asistencia asistencia = asistenciaRepository.findByIdEmpleadoAndFecha(idEmpleado, fecha).orElse(null);
        if (asistencia != null && asistencia.getFechaHoraIngreso() != null
                && asistencia.getFechaHoraSalida() == null) {
            LocalDateTime inicioActivo = LocalDateTime.of(fecha, asistencia.getEntradaProgramada());
            LocalDateTime finActivo = LocalDateTime.of(fecha, asistencia.getSalidaProgramada());
            if (JornadaEfectivaResolver.overlaps(inicio, fin, inicioActivo, finActivo)) {
                if (!fin.isAfter(LocalDateTime.now(operationalClock))) {
                    throw new BadRequestException("El nuevo fin debe ser posterior a la hora actual");
                }
                if (!inicio.equals(inicioActivo)) {
                    inicio = inicioActivo;
                    normalizacion = "Se conservo la hora programada del tramo que ya habia iniciado";
                }
            }
        }
        return new ValidatedAdjustment(horario, fecha, inicio, fin, origen, normalizacion);
    }

    private void publicarCambio(Long idEmpleado, LocalDate fecha) {
        realtimeNotifier.publishAfterCommit(
                "AJUSTE_JORNADA_AFECTADO", "AJUSTE", idEmpleado, fecha, null);
        realtimeNotifier.publishAfterCommit(
                "EXCEPCION_HORARIO_AFECTADA", "EXCEPCION", idEmpleado, fecha, null);
    }

    private void actualizarTramoActivo(Long idEmpleado, ValidatedAdjustment validated) {
        Asistencia asistencia = asistenciaRepository.findByIdEmpleadoAndFecha(idEmpleado, validated.fecha())
                .orElse(null);
        if (asistencia == null || asistencia.getFechaHoraIngreso() == null || asistencia.getFechaHoraSalida() != null) {
            return;
        }
        LocalDateTime inicioActivo = LocalDateTime.of(validated.fecha(), asistencia.getEntradaProgramada());
        LocalDateTime finActivo = LocalDateTime.of(validated.fecha(), asistencia.getSalidaProgramada());
        if (!JornadaEfectivaResolver.overlaps(
                validated.inicio(), validated.fin(), inicioActivo, finActivo)) {
            return;
        }
        asistencia.setEntradaProgramada(validated.inicio().toLocalTime());
        asistencia.setSalidaProgramada(validated.fin().toLocalTime());
        int objetivo = (int) java.time.Duration.between(validated.inicio(), validated.fin()).toMinutes();
        asistencia.setMinutosObjetivoDia(objetivo);
        asistencia.setMinutosBalance(asistencia.getMinutosTrabajados() - objetivo);
        asistenciaRepository.save(asistencia);
    }

    private AjusteJornadaResponse toResponse(AjusteJornada ajuste) {
        return AjusteJornadaResponse.builder()
                .id(ajuste.getId())
                .idEmpleado(ajuste.getIdEmpleado())
                .idHorario(ajuste.getHorario().getId())
                .fecha(ajuste.getFechaOperativa())
                .inicio(ajuste.getInicio())
                .fin(ajuste.getFin())
                .estado(ajuste.getEstado())
                .origen(ajuste.getOrigen())
                .motivo(ajuste.getMotivo())
                .creadoPor(ajuste.getCreadoPor())
                .reemplazadoPorId(ajuste.getReemplazadoPor() == null ? null : ajuste.getReemplazadoPor().getId())
                .createdAt(ajuste.getCreatedAt())
                .build();
    }

    private record ValidatedAdjustment(
            Horario horario,
            LocalDate fecha,
            LocalDateTime inicio,
            LocalDateTime fin,
            OrigenAjusteJornada origen,
            String normalizacion
    ) {
    }
}
