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
import pe.albrugroup.schedule_service.entity.enums.RazonAjuste;
import pe.albrugroup.schedule_service.entity.enums.TipoSesionEstado;
import pe.albrugroup.schedule_service.entity.request.asistencia.IniciarAlmuerzoRequest;
import pe.albrugroup.schedule_service.entity.response.asistencia.DetalleDiaResponse;
import pe.albrugroup.schedule_service.entity.response.asistencia.TramoAsistenciaResponse;
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

    private final AsistenciaRepository asistenciaRepository;
    private final AsistenciaTramoRepository asistenciaTramoRepository;
    private final AjusteJornadaRepository ajusteJornadaRepository;
    private final SesionEstadoRepository sesionEstadoRepository;
    private final JornadaEfectivaResolver jornadaEfectivaResolver;
    private final ParametroAsistenciaResolver parametroAsistenciaResolver;
    private final HorarioRepository horarioRepository;
    private final CurrentUser currentUser;
    private final AttendanceRealtimeNotifier attendanceRealtimeNotifier;

    // ===================== Marcacion =====================

    @Transactional
    public DetalleDiaResponse registrarIngreso() {
        Long idEmpleado = currentUser.empleadoID();
        LocalDate hoy = OperationalDateTime.today();
        LocalDateTime ahora = OperationalDateTime.nowLocalDateTime();

        JornadaEfectivaResponse jornada = jornadaEfectivaResolver.resolver(idEmpleado, hoy);
        TramoJornadaResponse tramo = tramoParaIngreso(jornada);
        if (tramo == null) {
            throw new BadRequestException("No tienes un horario programado para ingresar en este momento");
        }
        EffectiveParams params = parametroAsistenciaResolver.resolve(currentUser.roles());
        validarVentanaIngreso(ahora, tramo.getInicio(), tramo.getFin(), params, Boolean.TRUE.equals(tramo.getBase()),
                esOjt(currentUser.roles()));

        Asistencia asistencia = asistenciaRepository.findByIdEmpleadoAndFecha(idEmpleado, hoy).orElse(null);
        if (asistencia == null) {
            asistencia = crearAsistencia(idEmpleado, hoy, tramo, jornada);
        } else if (asistencia.getFechaHoraSalida() != null) {
            // Jornada cerrada: solo se re-ingresa si hay un tramo posterior (ampliacion) -> horas extra.
            if (!esTramoReingreso(asistencia, tramo)) {
                throw new BadRequestException("Tu jornada de hoy ya está cerrada");
            }
            prepararReingreso(asistencia, tramo);
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
        TramoJornadaResponse anchor = anclarABaseSiContiguo(jornada, tramo);
        OrigenTramo origen = mapOrigenTramo(anchor);
        VentanaAlmuerzo almuerzo = resolverAlmuerzoProgramado(horario, fecha);
        int minutosAlmuerzoProgramado = almuerzo == null ? 0
                : (int) Duration.between(almuerzo.inicio(), almuerzo.fin()).toMinutes();
        // Objetivo = jornada NETA del BASE (ventana menos almuerzo programado). Un tramo extra no tiene
        // objetivo (horas extra): las horas extra no perjudican el balance del horario programado.
        int objetivo = esBaseOrigen(origen)
                ? Math.max((int) Duration.between(anchor.getInicio(), anchor.getFin()).toMinutes() - minutosAlmuerzoProgramado, 0)
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

    /**
     * Si {@code tramo} es un tramo extra (no base) CONTIGUO al borde de un tramo base (extra-antes que pega
     * con la entrada base, o extra-despues que pega con la salida base), devuelve el tramo BASE para anclar
     * la asistencia como una sesion continua. Si {@code tramo} ya es base, o el extra tiene HUECO respecto
     * del base (no pega), devuelve el mismo {@code tramo} (flujo normal / dia partido).
     */
    private TramoJornadaResponse anclarABaseSiContiguo(JornadaEfectivaResponse jornada, TramoJornadaResponse tramo) {
        if (tramo == null || Boolean.TRUE.equals(tramo.getBase()) || jornada == null) {
            return tramo;
        }
        return jornada.getTramos().stream()
                .filter(t -> Boolean.TRUE.equals(t.getBase()))
                .filter(base -> base.getInicio().equals(tramo.getFin())   // extra-antes: pega con la entrada base
                        || base.getFin().equals(tramo.getInicio()))       // extra-despues: pega con la salida base
                .findFirst()
                .orElse(tramo);
    }

    /**
     * Tiempo trabajado del dia = jornada (con topes de entrada y salida) menos pausas personales.
     * Tope entrada = max(marca, entrada programada) -> marcar temprano no da positivo.
     * Tope salida = min(marca, salida programada) -> trabajar de mas no da positivo.
     * Se descuentan ALMUERZO + SERVICIOS + PAUSA_ACTIVA. CAPACITACION NO se descuenta (tiempo autorizado).
     */
    /**
     * Recalcula los totales del dia agregando tramos archivados + segmento actual, clasificados en 3
     * cubetas por origen + razon: BASE/REEMPLAZO_BASE -> minutosTrabajados y balance; aditivos con
     * razon COMPENSACION -> minutosCompensados (neutraliza deficit, no da positivo aqui); el resto de
     * aditivos (AMPLIACION operativa) -> minutosExtra. El status del dia (derivado) sale de la base.
     */
    private void recalcularMinutos(Asistencia asistencia) {
        int segmento = trabajadoSegmentoActual(asistencia);
        List<AsistenciaTramo> archivados = asistenciaTramoRepository.findByAsistenciaIdOrderByIdAsc(asistencia.getId());
        int base = 0, extra = 0, compensado = 0;
        for (AsistenciaTramo t : archivados) {
            int mt = safe(t.getMinutosTrabajados());
            switch (cubeta(t.getOrigen(), razonDe(t.getAjusteJornada()))) {
                case BASE -> base += mt;
                case EXTRA -> extra += mt;
                case COMPENSACION -> compensado += mt;
            }
        }
        switch (cubeta(asistencia.getOrigenTramoActual(), razonDe(asistencia.getAjusteJornadaActual()))) {
            case BASE -> base += segmento;
            case EXTRA -> extra += segmento;
            case COMPENSACION -> compensado += segmento;
        }
        // Sesion continua: si el segmento actual es el BASE y la marca cruzo un borde hacia un tramo extra
        // CONTIGUO (extra-antes / extra-despues sin OFFLINE), el tiempo trabajado en esas ventanas extra se
        // atribuye a su cubeta. trabajadoSegmentoActual ya capo el BASE a [entrada, salida], asi que aqui no
        // hay doble conteo. El gate (segmento actual = BASE) excluye el dia partido (segmento actual = extra,
        // ya contado por su cubeta) y evita el doble conteo.
        int[] extraContiguo = minutosExtraContiguos(asistencia);
        extra += extraContiguo[0];
        compensado += extraContiguo[1];
        asistencia.setMinutosTrabajados(base);
        asistencia.setMinutosExtra(extra);
        asistencia.setMinutosCompensados(compensado);
        // Invariante: balance <= 0. Trabajar de mas por cuenta propia NO da positivo; extra y compensacion
        // viven en sus propios acumuladores, separados del balance.
        asistencia.setMinutosBalance(Math.min(base - safe(asistencia.getMinutosObjetivoDia()), 0));
    }

    private enum Cubeta { BASE, EXTRA, COMPENSACION }

    /** Cubeta de un tramo: base (objetivo/balance), compensacion (neutraliza deficit) o extra. */
    private Cubeta cubeta(OrigenTramo origen, RazonAjuste razon) {
        if (esBaseOrigen(origen)) {
            return Cubeta.BASE;
        }
        return razon == RazonAjuste.COMPENSACION ? Cubeta.COMPENSACION : Cubeta.EXTRA;
    }

    private RazonAjuste razonDe(AjusteJornada ajuste) {
        return ajuste == null ? null : ajuste.getRazon();
    }

    /** Minutos trabajados del segmento ACTUAL (con topes de entrada/salida), menos sus pausas. */
    private int trabajadoSegmentoActual(Asistencia a) {
        LocalDateTime entradaProg = LocalDateTime.of(a.getFecha(), a.getEntradaProgramada());
        LocalDateTime topeSalida = topeSalida(a);
        LocalDateTime entradaEfectiva = a.getFechaHoraIngreso().isAfter(entradaProg) ? a.getFechaHoraIngreso() : entradaProg;
        LocalDateTime salidaEfectiva = a.getFechaHoraSalida().isAfter(topeSalida) ? topeSalida : a.getFechaHoraSalida();
        long jornada = Duration.between(entradaEfectiva, salidaEfectiva).toMinutes();
        int almuerzo = safe(a.getMinutosAlmuerzoTomados());
        int servicios = sumarSesionesCerradasDesde(a.getId(), TipoSesionEstado.SERVICIOS, a.getFechaHoraIngreso());
        int pausa = sumarPausaCapadaDesde(a.getId(), a.getFechaHoraIngreso());
        return (int) Math.max(jornada - almuerzo - servicios - pausa, 0);
    }

    /**
     * Minutos trabajados en ventanas extra CONTIGUAS al borde del base, durante una sesion continua
     * (el empleado cruzo el borde sin marcar OFFLINE). Devuelve {@code [extra, compensacion]}.
     *
     * Solo aplica cuando el segmento actual es el BASE: es la firma de la sesion continua. En el dia
     * partido el segmento actual es el tramo extra (lo cuenta su propia cubeta), asi que se retorna cero
     * para no duplicar. Cada ventana se topa a lo realmente autorizado por su interseccion con las marcas.
     */
    private int[] minutosExtraContiguos(Asistencia a) {
        if (!esBaseOrigen(a.getOrigenTramoActual())
                || a.getFechaHoraIngreso() == null || a.getFechaHoraSalida() == null
                || a.getEntradaProgramada() == null || a.getSalidaProgramada() == null) {
            return new int[]{0, 0};
        }
        LocalDateTime baseInicio = LocalDateTime.of(a.getFecha(), a.getEntradaProgramada());
        LocalDateTime baseFin = topeSalida(a);
        List<AjusteJornada> ajustes = ajusteJornadaRepository
                .findByIdEmpleadoAndFechaOperativaAndEstadoOrderByInicioAsc(
                        a.getIdEmpleado(), a.getFecha(), EstadoAjusteJornada.ACTIVO);
        int extra = 0, compensado = 0;
        for (AjusteJornada aj : ajustes) {
            if (aj.getOrigen() == OrigenAjusteJornada.REEMPLAZO_BASE
                    || aj.getInicio() == null || aj.getFin() == null) {
                continue; // REEMPLAZO_BASE sustituye el base, no es tiempo extra
            }
            boolean contiguo = aj.getFin().equals(baseInicio) || aj.getInicio().equals(baseFin);
            if (!contiguo) {
                continue; // con hueco -> no es sesion continua (dia partido)
            }
            int min = overlapMinutos(a.getFechaHoraIngreso(), a.getFechaHoraSalida(), aj.getInicio(), aj.getFin());
            if (aj.getRazon() == RazonAjuste.COMPENSACION) {
                compensado += min;
            } else {
                extra += min;
            }
        }
        return new int[]{extra, compensado};
    }

    /** Minutos de interseccion entre [aInicio, aFin] y [bInicio, bFin] (0 si no se solapan). */
    private int overlapMinutos(LocalDateTime aInicio, LocalDateTime aFin, LocalDateTime bInicio, LocalDateTime bFin) {
        LocalDateTime inicio = aInicio.isAfter(bInicio) ? aInicio : bInicio;
        LocalDateTime fin = aFin.isBefore(bFin) ? aFin : bFin;
        return (int) Math.max(Duration.between(inicio, fin).toMinutes(), 0);
    }

    // --- Re-ingreso (dia partido): archivar el segmento base y reabrir para el tramo extra ---

    private boolean esTramoReingreso(Asistencia a, TramoJornadaResponse tramo) {
        if (a.getSalidaProgramada() == null || tramo == null || tramo.getInicio() == null || tramo.getFin() == null) {
            return false;
        }
        LocalDateTime finAnterior = LocalDateTime.of(a.getFecha(), a.getSalidaProgramada());
        return tramo.getFin().isAfter(finAnterior) && !tramo.getInicio().isBefore(finAnterior);
    }

    private void prepararReingreso(Asistencia a, TramoJornadaResponse tramo) {
        archivarSegmentoActual(a);
        reiniciarParaTramo(a, tramo);
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
                .fechaHoraInicioAlmuerzo(a.getAlmuerzoRealInicio())
                .fechaHoraFinAlmuerzo(a.getAlmuerzoRealFin())
                .minutosObjetivo(Math.max(safe(a.getMinutosObjetivoDia()) - previosObjetivo, 0))
                .minutosTrabajados(Math.max(totalDia - previosTrabajados, 0))
                .minutosAlmuerzoTomados(safe(a.getMinutosAlmuerzoTomados()))
                .minutosServiciosAcumulados(0)
                .build());
    }

    private void reiniciarParaTramo(Asistencia a, TramoJornadaResponse tramo) {
        OrigenTramo origen = mapOrigenTramo(tramo);
        // El tramo extra no tiene objetivo (horas extra); un tramo base adicional sumaria su objetivo.
        int objetivoNuevo = esBaseOrigen(origen)
                ? (int) Duration.between(tramo.getInicio(), tramo.getFin()).toMinutes()
                : 0;
        a.setEntradaProgramada(tramo.getInicio().toLocalTime());
        a.setSalidaProgramada(tramo.getFin().toLocalTime());
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
        a.setOrigenTramoActual(origen);
        a.setAjusteJornadaActual(tramo.getIdAjuste() == null ? null
                : ajusteJornadaRepository.findById(tramo.getIdAjuste()).orElse(null));
        a.setMinutosObjetivoDia(safe(a.getMinutosObjetivoDia()) + objetivoNuevo);
        // minutosTrabajados / minutosExtra se conservan (totales del dia) y se recomputan al cerrar el tramo.
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

    /** Desglose de tramos del dia (solo dia partido): tramos archivados + segmento actual. */
    private List<TramoAsistenciaResponse> construirTramos(Asistencia a) {
        List<AsistenciaTramo> archivados = asistenciaTramoRepository.findByAsistenciaIdOrderByIdAsc(a.getId());
        if (archivados.isEmpty()) {
            return List.of();
        }
        List<TramoAsistenciaResponse> tramos = new ArrayList<>();
        int previosObjetivo = 0;
        int previosTrabajados = 0;
        for (AsistenciaTramo t : archivados) {
            tramos.add(TramoAsistenciaResponse.builder()
                    .origen(t.getOrigen())
                    .horaEntradaEstablecida(t.getEntradaProgramada())
                    .horaSalidaEstablecida(t.getSalidaProgramada())
                    .horaEntradaAsistencia(t.getFechaHoraIngreso() != null ? t.getFechaHoraIngreso().toLocalTime() : null)
                    .horaSalidaAsistencia(t.getFechaHoraSalida() != null ? t.getFechaHoraSalida().toLocalTime() : null)
                    .minutosObjetivo(t.getMinutosObjetivo())
                    .minutosTrabajados(t.getMinutosTrabajados())
                    .motivo(t.getMotivo())
                    .creadoPor(t.getCreadoPor())
                    .build());
            previosObjetivo += t.getMinutosObjetivo();
            previosTrabajados += t.getMinutosTrabajados();
        }
        int totalDia = safe(a.getMinutosTrabajados()) + safe(a.getMinutosExtra()) + safe(a.getMinutosCompensados());
        tramos.add(TramoAsistenciaResponse.builder()
                .origen(a.getOrigenTramoActual() == null ? OrigenTramo.BASE : a.getOrigenTramoActual())
                .horaEntradaEstablecida(a.getEntradaProgramada())
                .horaSalidaEstablecida(a.getSalidaProgramada())
                .horaEntradaAsistencia(a.getFechaHoraIngreso() != null ? a.getFechaHoraIngreso().toLocalTime() : null)
                .horaSalidaAsistencia(a.getFechaHoraSalida() != null ? a.getFechaHoraSalida().toLocalTime() : null)
                .minutosObjetivo(Math.max(safe(a.getMinutosObjetivoDia()) - previosObjetivo, 0))
                .minutosTrabajados(Math.max(totalDia - previosTrabajados, 0))
                .build());
        return tramos;
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

        boolean esHoy = fecha.equals(OperationalDateTime.today());
        boolean enTurnoActivo = esHoy && jornada != null && jornada.getTramoActual() != null;
        EffectiveParams params = parametroAsistenciaResolver.resolve(currentUser.roles());

        DetalleDiaResponse.DetalleDiaResponseBuilder b = DetalleDiaResponse.builder()
                .idEmpleado(idEmpleado)
                .fecha(fecha)
                .tieneHorario(jornada != null)
                .enTurnoActivo(enTurnoActivo)
                .maxMinutosPausaActiva(params.maxMinutosPausaActiva())
                .puedeMarcarIngreso(puedeMarcarIngresoAhora(jornada, asistencia, esHoy, params));

        if (asistencia != null) {
            SesionTotales tot = totales(asistencia.getId());
            boolean online = esHoy
                    && asistencia.getEstadoActual() == EstadoAsistencia.ONLINE
                    && asistencia.getFechaHoraIngreso() != null
                    && asistencia.getFechaHoraSalida() == null;
            int serviciosUsado = sumarSesionesCerradas(asistencia.getId(), TipoSesionEstado.SERVICIOS);
            int usosPausa = sesionEstadoRepository
                    .findByAsistenciaIdAndTipoOrderByInicioAsc(asistencia.getId(), TipoSesionEstado.PAUSA_ACTIVA).size();
            return b
                    .idHorario(asistencia.getIdHorario())
                    .estadoActual(asistencia.getEstadoActual())
                    .entradaProgramada(asistencia.getEntradaProgramada())
                    .salidaProgramada(asistencia.getSalidaProgramada())
                    .fechaHoraIngreso(asistencia.getFechaHoraIngreso())
                    .fechaHoraSalida(asistencia.getFechaHoraSalida())
                    .jornadaCerrada(asistencia.getFechaHoraSalida() != null)
                    .operativo(asistencia.getEstadoActual() == EstadoAsistencia.ONLINE && esHoy)
                    .puedeMarcarSalida(online)
                    .puedeIniciarAlmuerzo(online && enTurnoActivo
                            && asistencia.getAlmuerzoRealFin() == null
                            && ventanaAlmuerzoAbierta(asistencia))
                    .puedeIniciarServicios(online && enTurnoActivo
                            && serviciosUsado < safe(asistencia.getMinutosServiciosPermitidos()))
                    .puedeIniciarPausaActiva(online && enTurnoActivo
                            && usosPausa < params.maxUsosPausaActivaDia())
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
                    .sesionEnCurso(tot.enCurso())
                    .minutosServiciosTope(asistencia.getMinutosServiciosPermitidos())
                    .sesionActualTipo(tot.sesionActualTipo())
                    .sesionActualInicio(tot.sesionActualInicio())
                    .tramos(construirTramos(asistencia))
                    .build();
        }

        TramoJornadaResponse tramoRef = tramoReferencia(jornada);
        Horario horario = jornada != null ? horarioRepository.findById(jornada.getIdHorario()).orElse(null) : null;
        VentanaAlmuerzo almuerzo = horario != null ? resolverAlmuerzoProgramado(horario, fecha) : null;
        return b
                .idHorario(jornada != null ? jornada.getIdHorario() : null)
                .estadoActual(EstadoAsistencia.OFFLINE)
                .entradaProgramada(tramoRef != null ? tramoRef.getInicio().toLocalTime() : null)
                .salidaProgramada(tramoRef != null ? tramoRef.getFin().toLocalTime() : null)
                .jornadaCerrada(false)
                .operativo(false)
                .puedeMarcarSalida(false)
                .puedeIniciarAlmuerzo(false)
                .puedeIniciarServicios(false)
                .puedeIniciarPausaActiva(false)
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
                .sesionEnCurso(false)
                .minutosServiciosTope(horario != null ? horario.getMinutosServicios() : null)
                .tramos(List.of())
                .build();
    }

    /** Espeja la aceptacion de registrarIngreso: true sii marcar ingreso ahora seria aceptado. */
    private boolean puedeMarcarIngresoAhora(JornadaEfectivaResponse jornada, Asistencia asistencia,
                                            boolean esHoy, EffectiveParams params) {
        if (!esHoy) {
            return false;
        }
        TramoJornadaResponse tramo = tramoParaIngreso(jornada);
        if (tramo == null) {
            return false;
        }
        if (!ventanaIngresoAbierta(OperationalDateTime.nowLocalDateTime(), tramo.getInicio(), tramo.getFin(), params,
                Boolean.TRUE.equals(tramo.getBase()), esOjt(currentUser.roles()))) {
            return false;
        }
        if (asistencia == null) {
            return true;
        }
        if (asistencia.getFechaHoraSalida() != null) {
            return esTramoReingreso(asistencia, tramo);
        }
        return asistencia.getFechaHoraIngreso() == null;
    }

    /** Predicado de la ventana de ingreso (mismos limites que validarVentanaIngreso, sin lanzar). */
    private boolean ventanaIngresoAbierta(LocalDateTime ahora, LocalDateTime inicio, LocalDateTime fin,
                                          EffectiveParams params, boolean esBase, boolean permiteIngresoDuranteTurno) {
        if (ahora.isAfter(fin)) {
            return false;
        }
        long desfaseMin = Duration.between(inicio, ahora).toMinutes();
        if (desfaseMin < 0) {
            return -desfaseMin <= params.margenAdelantoMin();
        }
        return !esBase || permiteIngresoDuranteTurno || desfaseMin < params.bloqueoTardanzaMin();
    }

    private boolean esOjt(List<String> roles) {
        return roles != null && roles.stream().anyMatch(role -> "OJT".equalsIgnoreCase(role));
    }

    /** Ventana de marca de almuerzo: desde 15 min antes de la hora programada (sin ventana -> libre). */
    private boolean ventanaAlmuerzoAbierta(Asistencia a) {
        LocalTime lunchStart = a.getInicioAlmuerzoProgramado();
        if (lunchStart == null) {
            return true;
        }
        LocalDateTime desde = LocalDateTime.of(a.getFecha(), lunchStart).minusMinutes(VENTANA_MARCA_ALMUERZO_MIN);
        return !OperationalDateTime.nowLocalDateTime().isBefore(desde);
    }

    private Integer minutosEntre(LocalTime inicio, LocalTime fin) {
        if (inicio == null || fin == null) {
            return null;
        }
        return (int) Math.max(Duration.between(inicio, fin).toMinutes(), 0);
    }

    private TramoJornadaResponse tramoReferencia(JornadaEfectivaResponse jornada) {
        if (jornada == null) {
            return null;
        }
        if (jornada.getTramoActual() != null) {
            return jornada.getTramoActual();
        }
        if (jornada.getProximoTramo() != null) {
            return jornada.getProximoTramo();
        }
        return jornada.getTramos().isEmpty() ? null : jornada.getTramos().getLast();
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
