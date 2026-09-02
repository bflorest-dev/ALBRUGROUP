package pe.albrugroup.schedule_service.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.albrugroup.schedule_service.configuration.CurrentUser;
import pe.albrugroup.schedule_service.configuration.OperationalDateTime;
import pe.albrugroup.schedule_service.entity.AjusteJornada;
import pe.albrugroup.schedule_service.entity.Asistencia;
import pe.albrugroup.schedule_service.entity.AsistenciaTramo;
import pe.albrugroup.schedule_service.entity.Horario;
import pe.albrugroup.schedule_service.entity.SesionEstado;
import pe.albrugroup.schedule_service.entity.enums.Dia;
import pe.albrugroup.schedule_service.entity.enums.EstadoAjusteJornada;
import pe.albrugroup.schedule_service.entity.enums.EstadoAsistencia;
import pe.albrugroup.schedule_service.entity.enums.OrigenAjusteJornada;
import pe.albrugroup.schedule_service.entity.enums.OrigenAlmuerzo;
import pe.albrugroup.schedule_service.entity.enums.OrigenTramo;
import pe.albrugroup.schedule_service.entity.enums.EstadoTramoDia;
import pe.albrugroup.schedule_service.entity.enums.TipoTramoDia;
import pe.albrugroup.schedule_service.entity.enums.RazonAjuste;
import pe.albrugroup.schedule_service.entity.enums.TipoSesionEstado;
import pe.albrugroup.schedule_service.entity.request.asistencia.IniciarAlmuerzoRequest;
import pe.albrugroup.schedule_service.entity.response.asistencia.DetalleDiaResponse;
import pe.albrugroup.schedule_service.entity.response.asistencia.PoliticaMarcacionResponse;
import pe.albrugroup.schedule_service.entity.response.asistencia.TramoDiaResponse;
import pe.albrugroup.schedule_service.entity.response.horario.JornadaEfectivaResponse;
import pe.albrugroup.schedule_service.entity.response.horario.TramoJornadaResponse;
import pe.albrugroup.schedule_service.exception.BadRequestException;
import pe.albrugroup.schedule_service.exception.NotFoundException;
import pe.albrugroup.schedule_service.repository.AjusteJornadaRepository;
import pe.albrugroup.schedule_service.repository.AsistenciaRepository;
import pe.albrugroup.schedule_service.repository.AsistenciaTramoRepository;
import pe.albrugroup.schedule_service.repository.HorarioRepository;
import pe.albrugroup.schedule_service.repository.SesionEstadoRepository;
import pe.albrugroup.schedule_service.service.ParametroAsistenciaResolver.EffectiveParams;

import java.time.DayOfWeek;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Marcacion nueva (rediseno). Usa SOLO el motor nuevo ({@link JornadaEfectivaResolver}); sin ramas
 * viejo/nuevo. Convive con {@code AsistenciaService} hasta el cutover.
 *
 * Fase 3.1.a: read model del dia. Fase 3.1.b: ingreso/salida. Estados cronometrados (3.1.c) y almuerzo
 * (3.1.d) se agregan despues; {@code recalcularMinutos} ya los descuenta (0 mientras no existan).
 */
@Service
@RequiredArgsConstructor
public class MarcacionService {

    private static final String OJT_ROLE = "OJT";

    private final AsistenciaRepository asistenciaRepository;
    private final AsistenciaTramoRepository asistenciaTramoRepository;
    private final AjusteJornadaRepository ajusteJornadaRepository;
    private final SesionEstadoRepository sesionEstadoRepository;
    private final JornadaEfectivaResolver jornadaEfectivaResolver;
    private final ParametroAsistenciaResolver parametroAsistenciaResolver;
    private final HorarioRepository horarioRepository;
    private final PresenciaTramoService presenciaTramoService;
    private final CurrentUser currentUser;
    private final AttendanceRealtimeNotifier attendanceRealtimeNotifier;

    // ===================== Marcacion =====================

    @Transactional
    public DetalleDiaResponse registrarIngreso() {
        Long idEmpleado = currentUser.empleadoID();
        LocalDate hoy = OperationalDateTime.today();
        LocalDateTime ahora = OperationalDateTime.nowLocalDateTime();
        List<String> roles = currentUser.roles();
        boolean ojt = esOjt(roles);

        JornadaEfectivaResponse jornada = ojt
                ? jornadaEfectivaResolver.resolverSiExiste(idEmpleado, hoy).orElse(null)
                : jornadaEfectivaResolver.resolver(idEmpleado, hoy);
        TramoJornadaResponse tramo = tramoParaIngreso(jornada);
        if (tramo == null && !ojt) {
            throw new BadRequestException("No tienes un horario programado para ingresar en este momento");
        }
        EffectiveParams params = parametroAsistenciaResolver.resolve(roles);
        if (tramo != null && !ojt) {
            validarVentanaIngreso(ahora, tramo.getInicio(), tramo.getFin(), params, Boolean.TRUE.equals(tramo.getBase()), false);
        }

        Asistencia asistencia = asistenciaRepository.findByIdEmpleadoAndFecha(idEmpleado, hoy).orElse(null);
        // Tramo expirado sin salida: el auto-cierre del gateway (o el asesor que no marco salida)
        // dejo ingreso sin fecha_hora_salida. Forzar el cierre del tramo anterior para que el
        // mecanismo de re-ingreso funcione normalmente.
        if (asistencia != null) {
            forzarCierreTramoExpirado(asistencia, ahora);
        }
        if (asistencia == null) {
            asistencia = tramo != null
                    ? crearAsistencia(idEmpleado, hoy, tramo, jornada)
                    : crearAsistenciaOjtLibre(idEmpleado, hoy);
        } else if (asistencia.getFechaHoraSalida() != null) {
            if (ojt) {
                prepararReingresoOjtLibre(asistencia);
            } else {
                // Jornada cerrada: solo se re-ingresa si hay un tramo posterior (ampliacion) -> horas extra.
                if (tramo == null || !esTramoReingreso(asistencia, tramo)) {
                    throw new BadRequestException("Tu jornada de hoy ya está cerrada");
                }
                prepararReingreso(asistencia, tramo);
            }
        } else if (asistencia.getFechaHoraIngreso() != null) {
            throw new BadRequestException("El ingreso ya fue registrado para hoy");
        }

        EstadoAsistencia estadoAnterior = asistencia.getEstadoActual();
        asistencia.setFechaHoraIngreso(ahora);
        asistencia.setEstadoActual(EstadoAsistencia.ONLINE);
        asistenciaRepository.save(asistencia);

        publicar("ASISTENCIA_REGISTRO_CREADO", "INGRESO", idEmpleado, hoy, estadoAnterior);
        return getDia(idEmpleado, hoy);
    }

    @Transactional
    public DetalleDiaResponse registrarSalida() {
        Long idEmpleado = currentUser.empleadoID();
        LocalDate hoy = OperationalDateTime.today();
        LocalDateTime ahora = OperationalDateTime.nowLocalDateTime();

        Asistencia asistencia = asistenciaRepository.findByIdEmpleadoAndFecha(idEmpleado, hoy)
                .orElseThrow(() -> new NotFoundException("No hay asistencia registrada para hoy", hoy));
        if (asistencia.getFechaHoraIngreso() == null) {
            throw new BadRequestException("No existe un ingreso registrado para hoy");
        }
        if (asistencia.getFechaHoraSalida() != null) {
            throw new BadRequestException("La salida ya fue registrada para hoy");
        }
        if (asistencia.getEstadoActual() != EstadoAsistencia.ONLINE) {
            throw new BadRequestException("No puedes marcar salida con una pausa activa; retorna a ONLINE primero");
        }

        EstadoAsistencia estadoAnterior = asistencia.getEstadoActual();
        // La salida se permite despues del horario (gracia), pero el balance se topa en la salida programada.
        asistencia.setFechaHoraSalida(ahora);
        asistencia.setSalidaForzada(false); // marca OFFLINE real del empleado (cierre coherente)
        asistencia.setEstadoActual(EstadoAsistencia.OFFLINE);
        recalcularMinutos(asistencia);
        asistenciaRepository.save(asistencia);

        publicar("ASISTENCIA_ESTADO_CAMBIADO", "SALIDA", idEmpleado, hoy, estadoAnterior);
        return getDia(idEmpleado, hoy);
    }

    // ===================== Estados cronometrados (SERVICIOS / PAUSA_ACTIVA / CAPACITACION) =====================

    @Transactional
    public DetalleDiaResponse iniciarServicios() {
        Long idEmpleado = currentUser.empleadoID();
        Asistencia asistencia = getAsistenciaHoy(idEmpleado);
        aplicarVencimientoPausa(asistencia);
        validarPuedeIniciarPausa(asistencia);
        validarDentroHorario(idEmpleado, asistencia.getFecha());

        int usado = sumarSesionesCerradas(asistencia.getId(), TipoSesionEstado.SERVICIOS);
        int cap = asistencia.getMinutosServiciosPermitidos() != null ? asistencia.getMinutosServiciosPermitidos() : 0;
        if (usado >= cap) {
            throw new BadRequestException("Ya consumiste tus " + cap + " min de servicios de hoy; no puedes reactivarlo");
        }
        return abrirYResponder(asistencia, TipoSesionEstado.SERVICIOS, idEmpleado, "SERVICIOS_INICIO");
    }

    @Transactional
    public DetalleDiaResponse finalizarServicios() {
        Long idEmpleado = currentUser.empleadoID();
        Asistencia asistencia = getAsistenciaHoy(idEmpleado);
        if (asistencia.getEstadoActual() != EstadoAsistencia.SERVICIOS) {
            throw new BadRequestException("No tienes un tiempo de servicios en curso");
        }
        return cerrarYResponder(asistencia, TipoSesionEstado.SERVICIOS, idEmpleado, "SERVICIOS_FIN");
    }

    @Transactional
    public DetalleDiaResponse iniciarPausaActiva() {
        Long idEmpleado = currentUser.empleadoID();
        Asistencia asistencia = getAsistenciaHoy(idEmpleado);
        aplicarVencimientoPausa(asistencia);
        validarPuedeIniciarPausa(asistencia);
        validarDentroHorario(idEmpleado, asistencia.getFecha());

        int usos = sesionEstadoRepository
                .findByAsistenciaIdAndTipoOrderByInicioAsc(asistencia.getId(), TipoSesionEstado.PAUSA_ACTIVA).size();
        if (usos >= parametrosGlobales().maxUsosPausaActivaDia()) {
            throw new BadRequestException("Ya usaste tu pausa activa de hoy");
        }
        return abrirYResponder(asistencia, TipoSesionEstado.PAUSA_ACTIVA, idEmpleado, "PAUSA_ACTIVA_INICIO");
    }

    @Transactional
    public DetalleDiaResponse finalizarPausaActiva() {
        Long idEmpleado = currentUser.empleadoID();
        Asistencia asistencia = getAsistenciaHoy(idEmpleado);
        aplicarVencimientoPausa(asistencia);
        if (asistencia.getEstadoActual() != EstadoAsistencia.PAUSA_ACTIVA) {
            // Ya volvio a ONLINE (retorno anticipado o auto-vencimiento): idempotente.
            return getDia(idEmpleado, asistencia.getFecha());
        }
        return cerrarYResponder(asistencia, TipoSesionEstado.PAUSA_ACTIVA, idEmpleado, "PAUSA_ACTIVA_FIN");
    }

    /** Activa CAPACITACION para un empleado. La ejecuta un rol externo, no el propio asesor. */
    @Transactional
    public DetalleDiaResponse activarCapacitacion(Long idEmpleado) {
        Long actor = currentUser.empleadoID();
        Asistencia asistencia = getAsistenciaHoy(idEmpleado);
        aplicarVencimientoPausa(asistencia);
        validarPuedeIniciarPausa(asistencia);
        return abrirYResponder(asistencia, TipoSesionEstado.CAPACITACION, actor, "CAPACITACION_INICIO");
    }

    /** Finaliza CAPACITACION (el propio asesor puede salir, o el rol externo). Vuelve a ONLINE. */
    @Transactional
    public DetalleDiaResponse finalizarCapacitacion(Long idEmpleado) {
        Asistencia asistencia = getAsistenciaHoy(idEmpleado);
        if (asistencia.getEstadoActual() != EstadoAsistencia.CAPACITACION) {
            throw new BadRequestException("El empleado no está en CAPACITACION");
        }
        return cerrarYResponder(asistencia, TipoSesionEstado.CAPACITACION, idEmpleado, "CAPACITACION_FIN");
    }

    // --- helpers de estados cronometrados ---

    private DetalleDiaResponse abrirYResponder(Asistencia a, TipoSesionEstado tipo, Long creadoPor, String origenEvento) {
        EstadoAsistencia estadoAnterior = a.getEstadoActual();
        SesionEstado sesion = SesionEstado.builder()
                .asistencia(a)
                .tipo(tipo)
                .inicio(OperationalDateTime.nowLocalDateTime())
                .creadoPor(creadoPor)
                .build();
        sesionEstadoRepository.save(sesion);
        a.setEstadoActual(estadoDe(tipo));
        asistenciaRepository.save(a);
        publicar("ASISTENCIA_ESTADO_CAMBIADO", origenEvento, a.getIdEmpleado(), a.getFecha(), estadoAnterior);
        return getDia(a.getIdEmpleado(), a.getFecha());
    }

    private DetalleDiaResponse cerrarYResponder(Asistencia a, TipoSesionEstado tipo, Long idEmpleado, String origenEvento) {
        EstadoAsistencia estadoAnterior = a.getEstadoActual();
        cerrarSesionAbierta(a, tipo, OperationalDateTime.nowLocalDateTime());
        a.setEstadoActual(EstadoAsistencia.ONLINE);
        asistenciaRepository.save(a);
        publicar("ASISTENCIA_ESTADO_CAMBIADO", origenEvento, idEmpleado, a.getFecha(), estadoAnterior);
        return getDia(idEmpleado, a.getFecha());
    }

    private void cerrarSesionAbierta(Asistencia a, TipoSesionEstado tipo, LocalDateTime fin) {
        SesionEstado sesion = sesionEstadoRepository
                .findFirstByAsistenciaIdAndTipoAndFinIsNull(a.getId(), tipo)
                .orElseThrow(() -> new BadRequestException("No hay una sesión de " + tipo + " en curso"));
        sesion.setFin(fin);
        sesionEstadoRepository.save(sesion);
    }

    /**
     * Vencimiento de PAUSA_ACTIVA: si la sesion abierta supero el maximo, se cierra topada en
     * inicio+max y el empleado vuelve a ONLINE (auto-retorno). Idempotente; safety net del servidor
     * (el frontend tambien dispara el fin a los N min). Usa el parametro global (pausa uniforme).
     */
    private void aplicarVencimientoPausa(Asistencia a) {
        if (a.getEstadoActual() != EstadoAsistencia.PAUSA_ACTIVA) {
            return;
        }
        SesionEstado abierta = sesionEstadoRepository
                .findFirstByAsistenciaIdAndTipoAndFinIsNull(a.getId(), TipoSesionEstado.PAUSA_ACTIVA)
                .orElse(null);
        if (abierta == null) {
            return;
        }
        LocalDateTime vence = abierta.getInicio().plusMinutes(parametrosGlobales().maxMinutosPausaActiva());
        if (!OperationalDateTime.nowLocalDateTime().isBefore(vence)) {
            abierta.setFin(vence);
            sesionEstadoRepository.save(abierta);
            a.setEstadoActual(EstadoAsistencia.ONLINE);
            asistenciaRepository.save(a);
        }
    }

    private void validarPuedeIniciarPausa(Asistencia a) {
        if (a.getFechaHoraIngreso() == null) {
            throw new BadRequestException("No has registrado ingreso");
        }
        if (a.getFechaHoraSalida() != null) {
            throw new BadRequestException("Tu jornada de hoy ya está cerrada");
        }
        if (a.getEstadoActual() != EstadoAsistencia.ONLINE) {
            throw new BadRequestException("Debes estar ONLINE para cambiar de estado");
        }
    }

    private void validarDentroHorario(Long idEmpleado, LocalDate fecha) {
        boolean dentro = jornadaEfectivaResolver.resolverSiExiste(idEmpleado, fecha)
                .map(j -> j.getTramoActual() != null)
                .orElse(false);
        if (!dentro) {
            throw new BadRequestException("Estás fuera de tu horario programado");
        }
    }

    private Asistencia getAsistenciaHoy(Long idEmpleado) {
        LocalDate hoy = OperationalDateTime.today();
        return asistenciaRepository.findByIdEmpleadoAndFecha(idEmpleado, hoy)
                .orElseThrow(() -> new NotFoundException("No hay asistencia registrada para hoy", hoy));
    }

    private EstadoAsistencia estadoDe(TipoSesionEstado tipo) {
        return switch (tipo) {
            case SERVICIOS -> EstadoAsistencia.SERVICIOS;
            case PAUSA_ACTIVA -> EstadoAsistencia.PAUSA_ACTIVA;
            case CAPACITACION -> EstadoAsistencia.CAPACITACION;
        };
    }

    private EffectiveParams parametrosGlobales() {
        return parametroAsistenciaResolver.resolve(List.of());
    }

    private int sumarSesionesCerradas(Long asistenciaId, TipoSesionEstado tipo) {
        return sesionEstadoRepository.findByAsistenciaIdAndTipoOrderByInicioAsc(asistenciaId, tipo).stream()
                .filter(s -> s.getFin() != null)
                .mapToInt(s -> (int) Math.max(Duration.between(s.getInicio(), s.getFin()).toMinutes(), 0))
                .sum();
    }

    // ===================== ALMUERZO (estado vs. marcacion real) =====================

    private static final int VENTANA_MARCA_ALMUERZO_MIN = 15;

    /**
     * Entra al estado ALMUERZO (corta asignacion de leads). El contador real arranca cuando la bandeja
     * queda vacia: si {@code bandejaVacia}, arranca ya; si no, espera notificarBandejaVacia. Marca
     * permitida desde {@value #VENTANA_MARCA_ALMUERZO_MIN} min antes de la hora programada de almuerzo.
     */
    @Transactional
    public DetalleDiaResponse iniciarAlmuerzo(IniciarAlmuerzoRequest request) {
        Long idEmpleado = currentUser.empleadoID();
        Asistencia asistencia = getAsistenciaHoy(idEmpleado);
        aplicarVencimientoPausa(asistencia);
        validarPuedeIniciarPausa(asistencia);
        validarDentroHorario(idEmpleado, asistencia.getFecha());
        if (asistencia.getAlmuerzoRealFin() != null) {
            throw new BadRequestException("Ya registraste tu almuerzo de hoy");
        }

        LocalDateTime ahora = OperationalDateTime.nowLocalDateTime();
        LocalTime lunchStart = asistencia.getInicioAlmuerzoProgramado();
        if (lunchStart != null) {
            LocalDateTime desde = LocalDateTime.of(asistencia.getFecha(), lunchStart).minusMinutes(VENTANA_MARCA_ALMUERZO_MIN);
            if (ahora.isBefore(desde)) {
                throw new BadRequestException(
                        "Puedes marcar almuerzo hasta " + VENTANA_MARCA_ALMUERZO_MIN + " min antes de tu hora programada");
            }
        }

        boolean forzado = request != null && request.isForzado();
        EstadoAsistencia estadoAnterior = asistencia.getEstadoActual();
        asistencia.setEstadoActual(EstadoAsistencia.ALMUERZO);
        asistencia.setAlmuerzoEstadoDesde(ahora);
        asistencia.setOrigenAlmuerzo(forzado ? OrigenAlmuerzo.FORZADO : OrigenAlmuerzo.MANUAL);
        if (request != null && request.isBandejaVacia()) {
            asistencia.setAlmuerzoRealInicio(ahora);
        }
        asistenciaRepository.save(asistencia);
        publicar("ASISTENCIA_ESTADO_CAMBIADO", "ALMUERZO_INICIO", idEmpleado, asistencia.getFecha(), estadoAnterior);
        return getDia(idEmpleado, asistencia.getFecha());
    }

    /**
     * Senal "bandeja vacia" (contrato agnostico al emisor: frontend ahora, evento lead-service despues).
     * Si esta en ALMUERZO y el contador real aun no arranco, lo inicia. Idempotente.
     */
    @Transactional
    public DetalleDiaResponse notificarBandejaVacia() {
        Long idEmpleado = currentUser.empleadoID();
        Asistencia asistencia = getAsistenciaHoy(idEmpleado);
        if (asistencia.getEstadoActual() == EstadoAsistencia.ALMUERZO && asistencia.getAlmuerzoRealInicio() == null) {
            asistencia.setAlmuerzoRealInicio(OperationalDateTime.nowLocalDateTime());
            asistenciaRepository.save(asistencia);
        }
        return getDia(idEmpleado, asistencia.getFecha());
    }

    /** Retorno manual de ALMUERZO a ONLINE. Cierra la marcacion real y calcula los minutos tomados. */
    @Transactional
    public DetalleDiaResponse finalizarAlmuerzo() {
        Long idEmpleado = currentUser.empleadoID();
        Asistencia asistencia = getAsistenciaHoy(idEmpleado);
        if (asistencia.getEstadoActual() != EstadoAsistencia.ALMUERZO) {
            throw new BadRequestException("No tienes un almuerzo en curso");
        }
        LocalDateTime ahora = OperationalDateTime.nowLocalDateTime();
        // Si el contador nunca arranco (bandeja no reportada), arranca y cierra ahora (0 min).
        if (asistencia.getAlmuerzoRealInicio() == null) {
            asistencia.setAlmuerzoRealInicio(ahora);
        }
        asistencia.setAlmuerzoRealFin(ahora);
        asistencia.setMinutosAlmuerzoTomados(
                (int) Math.max(Duration.between(asistencia.getAlmuerzoRealInicio(), ahora).toMinutes(), 0));
        EstadoAsistencia estadoAnterior = asistencia.getEstadoActual();
        asistencia.setEstadoActual(EstadoAsistencia.ONLINE);
        asistenciaRepository.save(asistencia);
        publicar("ASISTENCIA_ESTADO_CAMBIADO", "ALMUERZO_FIN", idEmpleado, asistencia.getFecha(), estadoAnterior);
        return getDia(idEmpleado, asistencia.getFecha());
    }

    private VentanaAlmuerzo resolverAlmuerzoProgramado(Horario horario, LocalDate fecha) {
        Dia dia = mapearDia(fecha.getDayOfWeek());
        return horario.getDetalles().stream()
                .filter(d -> d.getDia() == dia)
                .findFirst()
                .filter(d -> d.getInicioAlmuerzo() != null && d.getFinAlmuerzo() != null)
                .map(d -> new VentanaAlmuerzo(d.getInicioAlmuerzo(), d.getFinAlmuerzo()))
                .orElse(null);
    }

    private Dia mapearDia(DayOfWeek dayOfWeek) {
        return switch (dayOfWeek) {
            case MONDAY -> Dia.LUNES;
            case TUESDAY -> Dia.MARTES;
            case WEDNESDAY -> Dia.MIERCOLES;
            case THURSDAY -> Dia.JUEVES;
            case FRIDAY -> Dia.VIERNES;
            case SATURDAY -> Dia.SABADO;
            case SUNDAY -> Dia.DOMINGO;
        };
    }

    private record VentanaAlmuerzo(LocalTime inicio, LocalTime fin) {}

    // ===================== Validaciones de ingreso =====================

    /**
     * Ventana de ingreso: se permite marcar desde {@code margenAdelanto} min antes de la entrada, y
     * hasta {@code bloqueoTardanza} min despues (a partir de ahi se exige corregir el horario). Nunca
     * despues del fin del turno. La tolerancia (PRESENTE vs TARDANZA) y el descuento se derivan/aplican
     * fuera (reporte / ms de calculo); aqui solo se decide si la marca se permite.
     */
    private void validarVentanaIngreso(LocalDateTime ahora, LocalDateTime inicio, LocalDateTime fin,
                                       EffectiveParams params, boolean esBase, boolean permiteIngresoDuranteTurno) {
        if (ahora.isAfter(fin)) {
            throw new BadRequestException("El turno de hoy ya terminó; no puedes marcar ingreso");
        }
        long desfaseMin = Duration.between(inicio, ahora).toMinutes(); // negativo = adelantado
        if (desfaseMin < 0) {
            if (-desfaseMin > params.margenAdelantoMin()) {
                throw new BadRequestException(
                        "Aún no puedes marcar ingreso; puedes hacerlo hasta " + params.margenAdelantoMin() + " min antes de tu horario");
            }
            return;
        }
        // El bloqueo por tardanza es un concepto del BASE: llegar tarde exige corregir el horario. En un
        // tramo EXTRA (horas extra) no hay tardanza: entrar mas tarde solo reduce el extra ganado, se permite
        // marcar en cualquier momento de la ventana.
        if (esBase && !permiteIngresoDuranteTurno && desfaseMin >= params.bloqueoTardanzaMin()) {
            throw new BadRequestException(
                    "Superaste la tolerancia de " + params.bloqueoTardanzaMin()
                            + " min; tu supervisor o RRHH deben corregir tu horario para permitir la marca");
        }
        // 0..bloqueo-1: permitido (puede resultar en tardanza, que se deriva en el reporte).
    }

    private TramoJornadaResponse tramoParaIngreso(JornadaEfectivaResponse jornada) {
        if (jornada == null) {
            return null;
        }
        // Dentro del tramo -> ese; si aun no empieza (marca adelantada) -> el proximo.
        return jornada.getTramoActual() != null ? jornada.getTramoActual() : jornada.getProximoTramo();
    }

    // ===================== Creacion / calculo =====================

    private Asistencia crearAsistencia(Long idEmpleado, LocalDate fecha,
                                       TramoJornadaResponse tramo, JornadaEfectivaResponse jornada) {
        Horario horario = horarioRepository.findById(jornada.getIdHorario())
                .orElseThrow(() -> new NotFoundException("Horario no encontrado", jornada.getIdHorario()));
        // Si la marca cae en un tramo extra CONTIGUO al borde del base, se ancla al base (sesion continua):
        // tardanza/salida/objetivo se miden contra el base; el tiempo en la ventana extra va a minutosExtra
        // (lo atribuye recalcularMinutos). Un extra CON HUECO no se ancla: sigue el flujo de dia partido.
        TramoJornadaResponse anchor = anclarABase(jornada, tramo);
        OrigenTramo origen = mapOrigenTramo(anchor);
        VentanaAlmuerzo almuerzo = resolverAlmuerzoProgramado(horario, fecha);
        int minutosAlmuerzoProgramado = almuerzo == null ? 0
                : (int) Duration.between(almuerzo.inicio(), almuerzo.fin()).toMinutes();
        // Objetivo = jornada NETA del BASE ORIGINAL (ventana programada menos almuerzo), NO la ventana del
        // corrimiento: un CORRIMIENTO parcial (mueve solo el ingreso, misma salida) deja la neta base intacta
        // como objetivo, asi la ventana mas corta produce el deficit que luego se cubre con COMPENSACION. Un
        // corrimiento que mueve TODA la ventana (misma duracion) da el mismo objetivo -> balance 0. Un tramo
        // extra no tiene objetivo (horas extra): no perjudican el balance del horario programado.
        int objetivo = esBaseOrigen(origen)
                ? objetivoNetaBase(horario, fecha, minutosAlmuerzoProgramado)
                : 0;
        // Nota: minutos_servicios_* / excedio_servicios son columnas viejas (NOT NULL) que se conservan
        // durante la transicion; el nuevo flujo usa sesion_estado. Se dropean en Fase 7.
        return asistenciaRepository.save(Asistencia.builder()
                .idEmpleado(idEmpleado)
                .idHorario(horario.getId())
                .fecha(fecha)
                .estadoActual(EstadoAsistencia.OFFLINE)
                .entradaProgramada(anchor.getInicio().toLocalTime())
                .salidaProgramada(anchor.getFin().toLocalTime())
                .inicioAlmuerzoProgramado(almuerzo == null ? null : almuerzo.inicio())
                .finAlmuerzoProgramado(almuerzo == null ? null : almuerzo.fin())
                .minutosObjetivoDia(objetivo)
                .minutosTrabajados(0)
                .minutosBalance(0)
                .minutosAlmuerzoTomados(0)
                .minutosServiciosPermitidos(horario.getMinutosServicios())
                .minutosServiciosAcumulados(0)
                .excedioServicios(Boolean.FALSE)
                .minutosExtra(0)
                .minutosCompensados(0)
                .origenTramoActual(origen)
                .ajusteJornadaActual(anchor.getIdAjuste() == null ? null
                        : ajusteJornadaRepository.findById(anchor.getIdAjuste()).orElse(null))
                .build());
    }

    private Asistencia crearAsistenciaOjtLibre(Long idEmpleado, LocalDate fecha) {
        return asistenciaRepository.save(Asistencia.builder()
                .idEmpleado(idEmpleado)
                .fecha(fecha)
                .estadoActual(EstadoAsistencia.OFFLINE)
                .minutosObjetivoDia(0)
                .minutosTrabajados(0)
                .minutosBalance(0)
                .minutosExtra(0)
                .minutosCompensados(0)
                .minutosAlmuerzoTomados(0)
                .minutosServiciosPermitidos(0)
                .minutosServiciosAcumulados(0)
                .excedioServicios(Boolean.FALSE)
                .build());
    }

    /**
     * Objetivo neto del BASE ORIGINAL del dia: ventana programada de {@link JornadaEfectivaResolver#resolverBase}
     * menos el almuerzo programado. Se usa como objetivo tanto para el base como para un CORRIMIENTO
     * (REEMPLAZO_BASE): el corrimiento mueve la ventana pero el objetivo del dia sigue siendo la neta base,
     * de modo que un corrimiento parcial deja deficit (horas por compensar). 0 si el dia no es laborable.
     */
    private int objetivoNetaBase(Horario horario, LocalDate fecha, int minutosAlmuerzoProgramado) {
        JornadaEfectivaResolver.BaseDiaria base = jornadaEfectivaResolver.resolverBase(horario, fecha);
        if (!base.laborable() || base.inicio() == null || base.fin() == null) {
            return 0;
        }
        return Math.max((int) Duration.between(base.inicio(), base.fin()).toMinutes() - minutosAlmuerzoProgramado, 0);
    }

    /**
     * Ancla la asistencia al tramo BASE del dia si existe (contiguo o con hueco): entrada/salida/objetivo/
     * origen se toman del base, y el credito de cada tramo se redistribuye por ventana en recalcularMinutos.
     * Si la primera marca cae en un extra pero hay base, se ancla al base (una sola jornada, sin re-ingreso
     * obligatorio para el caso continuo). Si NO hay base (dia extra-only, p. ej. jornada extraordinaria en
     * dia de descanso), se ancla al propio {@code tramo}.
     */
    private TramoJornadaResponse anclarABase(JornadaEfectivaResponse jornada, TramoJornadaResponse tramo) {
        if (jornada == null || tramo == null || Boolean.TRUE.equals(tramo.getBase())) {
            return tramo;
        }
        return jornada.getTramos().stream()
                .filter(t -> Boolean.TRUE.equals(t.getBase()))
                .findFirst()
                .orElse(tramo);
    }

    /**
     * Recalcula los totales del dia por REDISTRIBUCION por tramo (Opcion B): cada tramo esperado de la
     * jornada (base + extras/compensables) recibe el credito de la interseccion de los segmentos de marca
     * del dia con su ventana, topado por la cobertura de presencia. El ancla ya NO capa el calculo.
     *  - BASE / REEMPLAZO_BASE: suma a minutosTrabajados; el balance es min(base - objetivo, 0).
     *  - COMPENSACION: suma a minutosCompensados; el resto de aditivos, a minutosExtra.
     *  - Extras/compensables se ANULAN a 0 si el tramo no tuvo cierre coherente (salida real o handoff de
     *    presencia que cubre su fin): abandono. El base nunca se anula (los gaps quedan como deficit).
     * Las pausas personales del dia (almuerzo + servicios + pausa activa) se descuentan del tiempo base.
     */
    private void recalcularMinutos(Asistencia asistencia) {
        JornadaEfectivaResponse jornada = jornadaEfectivaResolver
                .resolverSiExiste(asistencia.getIdEmpleado(), asistencia.getFecha()).orElse(null);
        List<Segmento> segmentos = segmentosTrabajados(asistencia);
        boolean hayPresencia = presenciaTramoService.tienePresencia(asistencia.getIdEmpleado(), asistencia.getFecha());
        Map<Long, RazonAjuste> razonPorAjuste = ajusteJornadaRepository
                .findByIdEmpleadoAndFechaOperativaAndEstadoOrderByInicioAsc(
                        asistencia.getIdEmpleado(), asistencia.getFecha(), EstadoAjusteJornada.ACTIVO)
                .stream()
                .filter(aj -> aj.getId() != null)
                .collect(Collectors.toMap(AjusteJornada::getId,
                        aj -> aj.getRazon() == null ? RazonAjuste.AMPLIACION_OPERATIVA : aj.getRazon(),
                        (a, b) -> a));

        int base = 0, extra = 0, compensado = 0;
        if (jornada != null) {
            for (TramoJornadaResponse t : jornada.getTramos()) {
                if (t.getInicio() == null || t.getFin() == null) {
                    continue;
                }
                boolean esBase = Boolean.TRUE.equals(t.getBase())
                        || t.getOrigen() == OrigenAjusteJornada.REEMPLAZO_BASE;
                int credito = creditoTramo(asistencia, t, segmentos, hayPresencia, esBase);
                if (credito <= 0) {
                    continue;
                }
                if (esBase) {
                    base += credito;
                } else if (razonPorAjuste.get(t.getIdAjuste()) == RazonAjuste.COMPENSACION) {
                    compensado += credito;
                } else {
                    extra += credito;
                }
            }
        }

        // Las pausas personales ocurren dentro del turno base -> se descuentan del tiempo base.
        int pausas = safe(asistencia.getMinutosAlmuerzoTomados())
                + sumarSesionesCerradas(asistencia.getId(), TipoSesionEstado.SERVICIOS)
                + sumarPausaCapadaDesde(asistencia.getId(), null);
        base = Math.max(base - pausas, 0);

        asistencia.setMinutosTrabajados(base);
        asistencia.setMinutosExtra(extra);
        asistencia.setMinutosCompensados(compensado);
        // Invariante: balance <= 0. El extra/compensacion viven en sus propios acumuladores.
        asistencia.setMinutosBalance(Math.min(base - safe(asistencia.getMinutosObjetivoDia()), 0));
    }

    /**
     * Credito de un tramo = suma, sobre los segmentos de marca del dia, de la interseccion
     * [ingreso,salida] ∩ [tramo.inicio,tramo.fin], topada por la cobertura de presencia (si hay datos;
     * fail-open si no). Para tramos NO base aplica la regla de nulidad: si ningun segmento cerro
     * coherentemente el tramo (salida real o presencia que cubre el fin), el credito es 0 (abandono).
     */
    private int creditoTramo(Asistencia a, TramoJornadaResponse t, List<Segmento> segmentos,
                             boolean hayPresencia, boolean esBase) {
        int marcado = 0;
        boolean cerroReal = false;
        for (Segmento s : segmentos) {
            if (s.ingreso() == null || s.salida() == null) {
                continue;
            }
            int ov = overlapMinutos(s.ingreso(), s.salida(), t.getInicio(), t.getFin());
            if (ov <= 0) {
                continue;
            }
            if (hayPresencia) {
                LocalDateTime wi = s.ingreso().isAfter(t.getInicio()) ? s.ingreso() : t.getInicio();
                LocalDateTime wf = s.salida().isBefore(t.getFin()) ? s.salida() : t.getFin();
                ov = Math.min(ov, presenciaTramoService.minutosCubiertos(a.getIdEmpleado(), a.getFecha(), wi, wf));
            }
            marcado += Math.max(ov, 0);
            if (!Boolean.TRUE.equals(s.forzada())) {
                cerroReal = true;
            }
        }
        if (marcado <= 0) {
            return 0;
        }
        if (!esBase) {
            boolean coherente = cerroReal
                    || presenciaTramoService.estuvoConectadoEn(a.getIdEmpleado(), a.getFecha(), t.getFin());
            if (!coherente) {
                return 0; // extra/compensable abandonado -> se anula
            }
        }
        return marcado;
    }

    /** Segmentos de marca del dia: los archivados (re-ingreso) + el segmento actual, como pares crudos. */
    private List<Segmento> segmentosTrabajados(Asistencia a) {
        List<Segmento> segmentos = new ArrayList<>();
        for (AsistenciaTramo t : asistenciaTramoRepository.findByAsistenciaIdOrderByIdAsc(a.getId())) {
            segmentos.add(new Segmento(t.getFechaHoraIngreso(), t.getFechaHoraSalida(), t.getSalidaForzada()));
        }
        if (a.getFechaHoraIngreso() != null) {
            segmentos.add(new Segmento(a.getFechaHoraIngreso(), a.getFechaHoraSalida(), a.getSalidaForzada()));
        }
        return segmentos;
    }

    private record Segmento(LocalDateTime ingreso, LocalDateTime salida, Boolean forzada) {}

    /** Minutos de interseccion entre [aInicio, aFin] y [bInicio, bFin] (0 si no se solapan). */
    private int overlapMinutos(LocalDateTime aInicio, LocalDateTime aFin, LocalDateTime bInicio, LocalDateTime bFin) {
        LocalDateTime inicio = aInicio.isAfter(bInicio) ? aInicio : bInicio;
        LocalDateTime fin = aFin.isBefore(bFin) ? aFin : bFin;
        return (int) Math.max(Duration.between(inicio, fin).toMinutes(), 0);
    }

    // --- Cierre forzado de tramo expirado ---

    /**
     * Segmento colgado: el empleado tiene un ingreso abierto pero el TRAMO donde cayo ese ingreso ya
     * termino (dia partido con hueco, o extra abandonado antes del base). Se fuerza el cierre en el fin
     * de ESE tramo (no en la salidaProgramada del ancla, que con anclaje-al-base puede ser el fin del
     * base aunque el ingreso haya sido en un extra previo ya expirado). Tras esto, el re-ingreso al
     * tramo actual funciona. La salida forzada NO da cierre coherente (regla de nulidad de extras).
     * En la sesion continua (una sola marca que cruza el hueco sin re-marcar) esto NO se dispara: solo
     * se invoca al inicio de un registrarIngreso explicito.
     */
    private void forzarCierreTramoExpirado(Asistencia a, LocalDateTime ahora) {
        if (a.getFechaHoraIngreso() == null || a.getFechaHoraSalida() != null) {
            return;
        }
        JornadaEfectivaResponse jornada = jornadaEfectivaResolver
                .resolverSiExiste(a.getIdEmpleado(), a.getFecha()).orElse(null);
        LocalDateTime finTramoIngreso = finDelTramoQueContiene(jornada, a.getFechaHoraIngreso());
        if (finTramoIngreso == null || !ahora.isAfter(finTramoIngreso)) {
            return;
        }
        a.setFechaHoraSalida(finTramoIngreso);
        a.setSalidaForzada(true); // cierre forzado (no marca real): no cuenta como cierre coherente
        a.setEstadoActual(EstadoAsistencia.OFFLINE);
        recalcularMinutos(a);
        asistenciaRepository.save(a);
    }

    /** Fin del tramo de la jornada que contiene {@code instante}, o null si ninguno lo contiene. */
    private LocalDateTime finDelTramoQueContiene(JornadaEfectivaResponse jornada, LocalDateTime instante) {
        if (jornada == null || instante == null) {
            return null;
        }
        return jornada.getTramos().stream()
                .filter(t -> t.getInicio() != null && t.getFin() != null
                        && !instante.isBefore(t.getInicio()) && instante.isBefore(t.getFin()))
                .map(TramoJornadaResponse::getFin)
                .findFirst()
                .orElse(null);
    }

    // --- Re-ingreso (dia partido): archivar el segmento base y reabrir para el tramo extra ---

    private boolean esTramoReingreso(Asistencia a, TramoJornadaResponse tramo) {
        // Bajo redistribucion por tramo, reabrir es seguro: el credito se reparte por ventana desde todos
        // los segmentos. Se permite mientras exista un tramo marcable cuya ventana aun no termino (queda
        // trabajo del dia). La ventana concreta ya la valido validarVentanaIngreso.
        return tramo != null && tramo.getFin() != null
                && tramo.getFin().isAfter(OperationalDateTime.nowLocalDateTime());
    }

    private void prepararReingreso(Asistencia a, TramoJornadaResponse tramo) {
        // Archivar el segmento cerrado como par crudo y reabrir. El OBJETIVO del dia NO cambia (ya es la
        // neta base) y el credito lo redistribuye recalcularMinutos por tramo. Solo movemos el ancla de
        // DISPLAY (entrada/salida programada + origen) al tramo que se reingresa, para el desglose visual.
        archivarSegmentoActual(a);
        a.setEntradaProgramada(tramo.getInicio().toLocalTime());
        a.setSalidaProgramada(tramo.getFin().toLocalTime());
        a.setOrigenTramoActual(mapOrigenTramo(tramo));
        a.setAjusteJornadaActual(tramo.getIdAjuste() == null ? null
                : ajusteJornadaRepository.findById(tramo.getIdAjuste()).orElse(null));
        a.setFechaHoraIngreso(null);
        a.setFechaHoraSalida(null);
        a.setSalidaForzada(null);
        a.setEstadoActual(EstadoAsistencia.OFFLINE);
    }

    private void prepararReingresoOjtLibre(Asistencia a) {
        archivarSegmentoActual(a);
        a.setEntradaProgramada(null);
        a.setSalidaProgramada(null);
        a.setInicioAlmuerzoProgramado(null);
        a.setFinAlmuerzoProgramado(null);
        a.setFechaHoraIngreso(null);
        a.setFechaHoraSalida(null);
        a.setAlmuerzoEstadoDesde(null);
        a.setAlmuerzoRealInicio(null);
        a.setAlmuerzoRealFin(null);
        a.setOrigenAlmuerzo(null);
        a.setMinutosAlmuerzoTomados(0);
        a.setEstadoActual(EstadoAsistencia.OFFLINE);
        a.setOrigenTramoActual(null);
        a.setAjusteJornadaActual(null);
        a.setMinutosObjetivoDia(0);
        a.setMinutosTrabajados(0);
        a.setMinutosBalance(0);
        a.setMinutosExtra(0);
        a.setMinutosCompensados(0);
    }

    private void archivarSegmentoActual(Asistencia a) {
        List<AsistenciaTramo> previos = asistenciaTramoRepository.findByAsistenciaIdOrderByIdAsc(a.getId());
        int previosObjetivo = previos.stream().mapToInt(AsistenciaTramo::getMinutosObjetivo).sum();
        int previosTrabajados = previos.stream().mapToInt(AsistenciaTramo::getMinutosTrabajados).sum();
        int totalDia = safe(a.getMinutosTrabajados()) + safe(a.getMinutosExtra()) + safe(a.getMinutosCompensados());
        asistenciaTramoRepository.save(AsistenciaTramo.builder()
                .asistencia(a)
                .origen(a.getOrigenTramoActual() == null ? OrigenTramo.BASE : a.getOrigenTramoActual())
                .ajusteJornada(a.getAjusteJornadaActual())
                .entradaProgramada(a.getEntradaProgramada())
                .salidaProgramada(a.getSalidaProgramada())
                .inicioAlmuerzoProgramado(a.getInicioAlmuerzoProgramado())
                .finAlmuerzoProgramado(a.getFinAlmuerzoProgramado())
                .fechaHoraIngreso(a.getFechaHoraIngreso())
                .fechaHoraSalida(a.getFechaHoraSalida())
                .salidaForzada(a.getSalidaForzada())
                .fechaHoraInicioAlmuerzo(a.getAlmuerzoRealInicio())
                .fechaHoraFinAlmuerzo(a.getAlmuerzoRealFin())
                .minutosObjetivo(Math.max(safe(a.getMinutosObjetivoDia()) - previosObjetivo, 0))
                .minutosTrabajados(Math.max(totalDia - previosTrabajados, 0))
                .minutosAlmuerzoTomados(safe(a.getMinutosAlmuerzoTomados()))
                .minutosServiciosAcumulados(0)
                .build());
    }

    private OrigenTramo mapOrigenTramo(TramoJornadaResponse tramo) {
        if (Boolean.TRUE.equals(tramo.getBase()) || tramo.getOrigen() == null) {
            return OrigenTramo.BASE;
        }
        return switch (tramo.getOrigen()) {
            case REEMPLAZO_BASE -> OrigenTramo.REEMPLAZO_BASE;
            case JORNADA_EXTRAORDINARIA -> OrigenTramo.JORNADA_EXTRAORDINARIA;
            case TRAMO_ADICIONAL -> OrigenTramo.TRAMO_ADICIONAL;
        };
    }

    private boolean esBaseOrigen(OrigenTramo origen) {
        return origen == null || origen == OrigenTramo.BASE || origen == OrigenTramo.REEMPLAZO_BASE;
    }

    private int safe(Integer valor) {
        return valor == null ? 0 : valor;
    }

    private int sumarSesionesCerradasDesde(Long asistenciaId, TipoSesionEstado tipo, LocalDateTime desde) {
        return sesionEstadoRepository.findByAsistenciaIdAndTipoOrderByInicioAsc(asistenciaId, tipo).stream()
                .filter(s -> s.getFin() != null)
                .filter(s -> desde == null || !s.getInicio().isBefore(desde))
                .mapToInt(s -> (int) Math.max(Duration.between(s.getInicio(), s.getFin()).toMinutes(), 0))
                .sum();
    }

    private int sumarPausaCapadaDesde(Long asistenciaId, LocalDateTime desde) {
        int max = parametrosGlobales().maxMinutosPausaActiva();
        return sesionEstadoRepository
                .findByAsistenciaIdAndTipoOrderByInicioAsc(asistenciaId, TipoSesionEstado.PAUSA_ACTIVA).stream()
                .filter(s -> s.getFin() != null)
                .filter(s -> desde == null || !s.getInicio().isBefore(desde))
                .mapToInt(s -> Math.min((int) Math.max(Duration.between(s.getInicio(), s.getFin()).toMinutes(), 0), max))
                .sum();
    }

    private LocalDateTime topeSalida(Asistencia asistencia) {
        if (asistencia.getEntradaProgramada() == null || asistencia.getSalidaProgramada() == null) {
            return null;
        }
        LocalDateTime tope = LocalDateTime.of(asistencia.getFecha(), asistencia.getSalidaProgramada());
        // Turno que cruza medianoche (salida <= entrada): la salida cae al dia siguiente.
        if (!asistencia.getSalidaProgramada().isAfter(asistencia.getEntradaProgramada())) {
            tope = tope.plusDays(1);
        }
        return tope;
    }

    private void publicar(String tipo, String origen, Long idEmpleado, LocalDate fecha, EstadoAsistencia estadoAnterior) {
        attendanceRealtimeNotifier.publishAfterCommit(tipo, origen, idEmpleado, fecha, estadoAnterior);
    }

    // ===================== Read model del dia =====================

    @Transactional(readOnly = true)
    public DetalleDiaResponse getDia(Long idEmpleado, LocalDate fecha) {
        JornadaEfectivaResponse jornada = jornadaEfectivaResolver.resolverSiExiste(idEmpleado, fecha).orElse(null);
        Asistencia asistencia = asistenciaRepository.findByIdEmpleadoAndFecha(idEmpleado, fecha).orElse(null);
        List<String> roles = currentUser.roles();
        boolean ojt = esOjt(roles);
        EffectiveParams params = parametroAsistenciaResolver.resolve(roles);

        // El backend entrega los INSUMOS (tramos resueltos + politica + estado); el frontend deriva las
        // compuertas con su reloj vivo y el backend re-valida en el write. Sin booleanos puede* vencidos.
        PoliticaMarcacionResponse politica = PoliticaMarcacionResponse.builder()
                .margenAdelantoMin(params.margenAdelantoMin())
                .bloqueoTardanzaMin(params.bloqueoTardanzaMin())
                .maxMinutosPausaActiva(params.maxMinutosPausaActiva())
                .maxUsosPausaActivaDia(params.maxUsosPausaActivaDia())
                .ventanaMarcaAlmuerzoMin(VENTANA_MARCA_ALMUERZO_MIN)
                .permiteIngresoDuranteTurno(ojt)
                .build();

        DetalleDiaResponse.DetalleDiaResponseBuilder b = DetalleDiaResponse.builder()
                .idEmpleado(idEmpleado)
                .fecha(fecha)
                .tieneHorario(jornada != null)
                .politica(politica)
                .tramos(construirTramosDia(asistencia, jornada))
                .version(calcularVersion(jornada, asistencia))
                .maxMinutosPausaActiva(params.maxMinutosPausaActiva());

        if (asistencia != null) {
            SesionTotales tot = totales(asistencia.getId());
            int usosPausa = sesionEstadoRepository
                    .findByAsistenciaIdAndTipoOrderByInicioAsc(asistencia.getId(), TipoSesionEstado.PAUSA_ACTIVA).size();
            return b
                    .idHorario(asistencia.getIdHorario())
                    .estadoActual(asistencia.getEstadoActual())
                    .fechaHoraIngreso(asistencia.getFechaHoraIngreso())
                    .fechaHoraSalida(asistencia.getFechaHoraSalida())
                    .jornadaCerrada(asistencia.getFechaHoraSalida() != null)
                    .minutosObjetivoDia(asistencia.getMinutosObjetivoDia())
                    .minutosTrabajados(asistencia.getMinutosTrabajados())
                    .minutosBalance(asistencia.getMinutosBalance())
                    .minutosExtra(asistencia.getMinutosExtra())
                    .minutosCompensados(asistencia.getMinutosCompensados())
                    .inicioAlmuerzoProgramado(asistencia.getInicioAlmuerzoProgramado())
                    .minutosAlmuerzoProgramado(minutosEntre(asistencia.getInicioAlmuerzoProgramado(), asistencia.getFinAlmuerzoProgramado()))
                    .almuerzoEstadoDesde(asistencia.getAlmuerzoEstadoDesde())
                    .almuerzoRealInicio(asistencia.getAlmuerzoRealInicio())
                    .almuerzoRealFin(asistencia.getAlmuerzoRealFin())
                    .origenAlmuerzo(asistencia.getOrigenAlmuerzo())
                    .minutosAlmuerzoTomados(asistencia.getMinutosAlmuerzoTomados())
                    .minutosServiciosHoy(tot.servicios())
                    .minutosPausaActivaHoy(tot.pausa())
                    .minutosCapacitacionHoy(tot.capacitacion())
                    .pausaActivaUsosHoy(usosPausa)
                    .sesionEnCurso(tot.enCurso())
                    .minutosServiciosTope(asistencia.getMinutosServiciosPermitidos())
                    .sesionActualTipo(tot.sesionActualTipo())
                    .sesionActualInicio(tot.sesionActualInicio())
                    .build();
        }

        Horario horario = jornada != null ? horarioRepository.findById(jornada.getIdHorario()).orElse(null) : null;
        VentanaAlmuerzo almuerzo = horario != null ? resolverAlmuerzoProgramado(horario, fecha) : null;
        return b
                .idHorario(jornada != null ? jornada.getIdHorario() : null)
                .estadoActual(EstadoAsistencia.OFFLINE)
                .jornadaCerrada(false)
                .minutosObjetivoDia(objetivoJornada(jornada))
                .minutosTrabajados(0)
                .minutosBalance(0)
                .minutosExtra(0)
                .minutosCompensados(0)
                .inicioAlmuerzoProgramado(almuerzo != null ? almuerzo.inicio() : null)
                .minutosAlmuerzoProgramado(almuerzo != null ? (int) Duration.between(almuerzo.inicio(), almuerzo.fin()).toMinutes() : null)
                .minutosAlmuerzoTomados(0)
                .minutosServiciosHoy(0)
                .minutosPausaActivaHoy(0)
                .minutosCapacitacionHoy(0)
                .pausaActivaUsosHoy(0)
                .sesionEnCurso(false)
                .minutosServiciosTope(horario != null ? horario.getMinutosServicios() : null)
                .build();
    }

    /**
     * Proyeccion pura de la jornada del dia: todos los tramos (base + extras/compensables) con su tipo,
     * subestado derivado y credito. NO muta nada. El frontend deriva de aqui el tramo vigente/proximo/hueco
     * y las compuertas con su reloj. Sin jornada -> lista vacia.
     */
    private List<TramoDiaResponse> construirTramosDia(Asistencia a, JornadaEfectivaResponse jornada) {
        if (jornada == null) {
            return List.of();
        }
        LocalDateTime ahora = OperationalDateTime.nowLocalDateTime();
        List<Segmento> segmentos = a != null ? segmentosTrabajados(a) : List.of();
        boolean hayPresencia = a != null && presenciaTramoService.tienePresencia(a.getIdEmpleado(), a.getFecha());
        Map<Long, RazonAjuste> razonPorAjuste = a == null ? Map.of() : ajusteJornadaRepository
                .findByIdEmpleadoAndFechaOperativaAndEstadoOrderByInicioAsc(
                        a.getIdEmpleado(), a.getFecha(), EstadoAjusteJornada.ACTIVO)
                .stream()
                .filter(aj -> aj.getId() != null)
                .collect(Collectors.toMap(AjusteJornada::getId,
                        aj -> aj.getRazon() == null ? RazonAjuste.AMPLIACION_OPERATIVA : aj.getRazon(),
                        (x, y) -> x));

        List<TramoDiaResponse> out = new ArrayList<>();
        for (TramoJornadaResponse t : jornada.getTramos()) {
            if (t.getInicio() == null || t.getFin() == null) {
                continue;
            }
            boolean esBase = Boolean.TRUE.equals(t.getBase())
                    || t.getOrigen() == OrigenAjusteJornada.REEMPLAZO_BASE;
            TipoTramoDia tipo = esBase ? TipoTramoDia.BASE
                    : (razonPorAjuste.get(t.getIdAjuste()) == RazonAjuste.COMPENSACION
                            ? TipoTramoDia.COMPENSABLE : TipoTramoDia.EXTRA);
            int credito = a != null ? creditoTramo(a, t, segmentos, hayPresencia, esBase) : 0;

            LocalDateTime ingresoReal = null, salidaReal = null;
            boolean huboMarca = false;
            for (Segmento s : segmentos) {
                if (s.ingreso() == null) {
                    continue;
                }
                LocalDateTime segFin = s.salida() != null ? s.salida() : ahora; // segmento abierto -> hasta ahora
                if (overlapMinutos(s.ingreso(), segFin, t.getInicio(), t.getFin()) <= 0) {
                    continue;
                }
                huboMarca = true;
                LocalDateTime i = s.ingreso().isAfter(t.getInicio()) ? s.ingreso() : t.getInicio();
                if (ingresoReal == null || i.isBefore(ingresoReal)) ingresoReal = i;
                if (s.salida() != null) { // salida real cerrada (un segmento abierto no aporta salidaReal)
                    LocalDateTime f = s.salida().isBefore(t.getFin()) ? s.salida() : t.getFin();
                    if (salidaReal == null || f.isAfter(salidaReal)) salidaReal = f;
                }
            }

            EstadoTramoDia estado;
            if (ahora.isBefore(t.getInicio())) {
                estado = EstadoTramoDia.PENDIENTE;
            } else if (ahora.isBefore(t.getFin())) {
                estado = EstadoTramoDia.EN_CURSO;
            } else if (credito > 0) {
                estado = EstadoTramoDia.CUMPLIDO;
            } else if (huboMarca && !esBase) {
                estado = EstadoTramoDia.ANULADO;
            } else {
                estado = EstadoTramoDia.EXPIRADO;
            }

            out.add(TramoDiaResponse.builder()
                    .idAjuste(t.getIdAjuste())
                    .tipo(tipo)
                    .inicio(t.getInicio())
                    .fin(t.getFin())
                    .estado(estado)
                    .ingresoReal(ingresoReal)
                    .salidaReal(salidaReal)
                    .minutosAcreditados(credito)
                    .build());
        }
        return out;
    }

    /** Version del read model: cambia cuando cambian los tramos o el estado de la asistencia. */
    private String calcularVersion(JornadaEfectivaResponse jornada, Asistencia asistencia) {
        List<String> firma = jornada == null ? List.of()
                : jornada.getTramos().stream()
                        .map(t -> t.getIdAjuste() + "|" + t.getInicio() + "|" + t.getFin())
                        .toList();
        return Integer.toHexString(java.util.Objects.hash(
                jornada != null ? jornada.getIdHorario() : null,
                firma,
                asistencia != null ? asistencia.getEstadoActual() : null,
                asistencia != null ? asistencia.getUpdatedAt() : null,
                asistencia != null ? asistencia.getFechaHoraIngreso() : null,
                asistencia != null ? asistencia.getFechaHoraSalida() : null));
    }

    private boolean esOjt(List<String> roles) {
        return roles != null && roles.stream().anyMatch(role -> OJT_ROLE.equalsIgnoreCase(role));
    }

    private Integer minutosEntre(LocalTime inicio, LocalTime fin) {
        if (inicio == null || fin == null) {
            return null;
        }
        return (int) Math.max(Duration.between(inicio, fin).toMinutes(), 0);
    }

    private int objetivoJornada(JornadaEfectivaResponse jornada) {
        if (jornada == null) {
            return 0;
        }
        return jornada.getTramos().stream()
                .mapToInt(t -> (int) Duration.between(t.getInicio(), t.getFin()).toMinutes())
                .sum();
    }

    /** Totales del dia por tipo de sesion; una sesion en curso (fin=null) se cuenta hasta ahora. */
    private SesionTotales totales(Long asistenciaId) {
        LocalDateTime ahora = OperationalDateTime.nowLocalDateTime();
        List<SesionEstado> sesiones = sesionEstadoRepository.findByAsistenciaIdOrderByInicioAsc(asistenciaId);
        int servicios = 0;
        int pausa = 0;
        int capacitacion = 0;
        boolean enCurso = false;
        TipoSesionEstado abiertaTipo = null;
        LocalDateTime abiertaInicio = null;
        for (SesionEstado sesion : sesiones) {
            LocalDateTime fin = sesion.getFin() != null ? sesion.getFin() : ahora;
            int minutos = (int) Math.max(Duration.between(sesion.getInicio(), fin).toMinutes(), 0);
            switch (sesion.getTipo()) {
                case SERVICIOS -> servicios += minutos;
                case PAUSA_ACTIVA -> pausa += minutos;
                case CAPACITACION -> capacitacion += minutos;
            }
            if (sesion.getFin() == null) {
                enCurso = true;
                abiertaTipo = sesion.getTipo();
                abiertaInicio = sesion.getInicio();
            }
        }
        return new SesionTotales(servicios, pausa, capacitacion, enCurso, abiertaTipo, abiertaInicio);
    }

    private record SesionTotales(int servicios, int pausa, int capacitacion, boolean enCurso,
                                 TipoSesionEstado sesionActualTipo, LocalDateTime sesionActualInicio) {}
}
