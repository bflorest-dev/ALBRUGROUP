package pe.albrugroup.schedule_service.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.albrugroup.schedule_service.configuration.CurrentUser;
import pe.albrugroup.schedule_service.configuration.OperationalDateTime;
import pe.albrugroup.schedule_service.entity.Asistencia;
import pe.albrugroup.schedule_service.entity.Horario;
import pe.albrugroup.schedule_service.entity.SesionEstado;
import pe.albrugroup.schedule_service.entity.enums.Dia;
import pe.albrugroup.schedule_service.entity.enums.EstadoAsistencia;
import pe.albrugroup.schedule_service.entity.enums.OrigenAlmuerzo;
import pe.albrugroup.schedule_service.entity.enums.TipoSesionEstado;
import pe.albrugroup.schedule_service.entity.request.asistencia.IniciarAlmuerzoRequest;
import pe.albrugroup.schedule_service.entity.response.asistencia.DetalleDiaResponse;
import pe.albrugroup.schedule_service.entity.response.horario.JornadaEfectivaResponse;
import pe.albrugroup.schedule_service.entity.response.horario.TramoJornadaResponse;
import pe.albrugroup.schedule_service.exception.BadRequestException;
import pe.albrugroup.schedule_service.exception.NotFoundException;
import pe.albrugroup.schedule_service.repository.AsistenciaRepository;
import pe.albrugroup.schedule_service.repository.HorarioRepository;
import pe.albrugroup.schedule_service.repository.SesionEstadoRepository;
import pe.albrugroup.schedule_service.service.ParametroAsistenciaResolver.EffectiveParams;

import java.time.DayOfWeek;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
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
        validarVentanaIngreso(ahora, tramo.getInicio(), tramo.getFin(), params);

        Asistencia asistencia = getOrCreateAsistencia(idEmpleado, hoy, tramo, jornada);
        if (asistencia.getFechaHoraIngreso() != null) {
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
    private void validarVentanaIngreso(LocalDateTime ahora, LocalDateTime inicio, LocalDateTime fin, EffectiveParams params) {
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
        if (desfaseMin >= params.bloqueoTardanzaMin()) {
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

    private Asistencia getOrCreateAsistencia(Long idEmpleado, LocalDate fecha,
                                             TramoJornadaResponse tramo, JornadaEfectivaResponse jornada) {
        return asistenciaRepository.findByIdEmpleadoAndFecha(idEmpleado, fecha)
                .orElseGet(() -> crearAsistencia(idEmpleado, fecha, tramo, jornada));
    }

    private Asistencia crearAsistencia(Long idEmpleado, LocalDate fecha,
                                       TramoJornadaResponse tramo, JornadaEfectivaResponse jornada) {
        Horario horario = horarioRepository.findById(jornada.getIdHorario())
                .orElseThrow(() -> new NotFoundException("Horario no encontrado", jornada.getIdHorario()));
        VentanaAlmuerzo almuerzo = resolverAlmuerzoProgramado(horario, fecha);
        int minutosAlmuerzoProgramado = almuerzo == null ? 0
                : (int) Duration.between(almuerzo.inicio(), almuerzo.fin()).toMinutes();
        // Objetivo = jornada NETA = ventana de trabajo menos el almuerzo programado.
        int objetivo = Math.max(
                (int) Duration.between(tramo.getInicio(), tramo.getFin()).toMinutes() - minutosAlmuerzoProgramado, 0);
        // Nota: minutos_servicios_* / excedio_servicios son columnas viejas (NOT NULL) que se conservan
        // durante la transicion; el nuevo flujo usa sesion_estado. Se dropean en Fase 7.
        return asistenciaRepository.save(Asistencia.builder()
                .idEmpleado(idEmpleado)
                .idHorario(horario.getId())
                .fecha(fecha)
                .estadoActual(EstadoAsistencia.OFFLINE)
                .entradaProgramada(tramo.getInicio().toLocalTime())
                .salidaProgramada(tramo.getFin().toLocalTime())
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
                .build());
    }

    /**
     * Tiempo trabajado del dia = jornada (con topes de entrada y salida) menos pausas personales.
     * Tope entrada = max(marca, entrada programada) -> marcar temprano no da positivo.
     * Tope salida = min(marca, salida programada) -> trabajar de mas no da positivo.
     * Se descuentan ALMUERZO + SERVICIOS + PAUSA_ACTIVA. CAPACITACION NO se descuenta (tiempo autorizado).
     */
    private void recalcularMinutos(Asistencia asistencia) {
        LocalDateTime entradaProg = LocalDateTime.of(asistencia.getFecha(), asistencia.getEntradaProgramada());
        LocalDateTime topeSalida = topeSalida(asistencia);

        LocalDateTime entradaEfectiva = asistencia.getFechaHoraIngreso().isAfter(entradaProg)
                ? asistencia.getFechaHoraIngreso() : entradaProg;
        LocalDateTime salidaEfectiva = asistencia.getFechaHoraSalida().isAfter(topeSalida)
                ? topeSalida : asistencia.getFechaHoraSalida();

        long minutosJornada = Duration.between(entradaEfectiva, salidaEfectiva).toMinutes();
        int almuerzo = asistencia.getMinutosAlmuerzoTomados() != null ? asistencia.getMinutosAlmuerzoTomados() : 0;
        int servicios = sumarSesionesCerradas(asistencia.getId(), TipoSesionEstado.SERVICIOS);
        int pausa = sumarPausaCapada(asistencia.getId());

        int trabajados = (int) Math.max(minutosJornada - almuerzo - servicios - pausa, 0);
        asistencia.setMinutosTrabajados(trabajados);
        // Invariante: balance <= 0. Trabajar de mas por cuenta propia (p. ej. saltarse el almuerzo o
        // quedarse pasada la salida) NO da positivo; el tiempo extra autorizado vive en minutosExtra.
        asistencia.setMinutosBalance(Math.min(trabajados - asistencia.getMinutosObjetivoDia(), 0));
    }

    private LocalDateTime topeSalida(Asistencia asistencia) {
        LocalDateTime tope = LocalDateTime.of(asistencia.getFecha(), asistencia.getSalidaProgramada());
        // Turno que cruza medianoche (salida <= entrada): la salida cae al dia siguiente.
        if (!asistencia.getSalidaProgramada().isAfter(asistencia.getEntradaProgramada())) {
            tope = tope.plusDays(1);
        }
        return tope;
    }

    /** Suma de PAUSA_ACTIVA topando cada sesion en su maximo, para que el balance nunca cuente de mas. */
    private int sumarPausaCapada(Long asistenciaId) {
        int max = parametrosGlobales().maxMinutosPausaActiva();
        return sesionEstadoRepository
                .findByAsistenciaIdAndTipoOrderByInicioAsc(asistenciaId, TipoSesionEstado.PAUSA_ACTIVA).stream()
                .filter(s -> s.getFin() != null)
                .mapToInt(s -> Math.min((int) Math.max(Duration.between(s.getInicio(), s.getFin()).toMinutes(), 0), max))
                .sum();
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
        boolean dentroHorario = esHoy && jornada != null && jornada.getTramoActual() != null;

        DetalleDiaResponse.DetalleDiaResponseBuilder b = DetalleDiaResponse.builder()
                .idEmpleado(idEmpleado)
                .fecha(fecha)
                .tieneHorario(jornada != null)
                .dentroHorario(dentroHorario);

        if (asistencia != null) {
            SesionTotales tot = totales(asistencia.getId());
            return b
                    .idHorario(asistencia.getIdHorario())
                    .estadoActual(asistencia.getEstadoActual())
                    .entradaProgramada(asistencia.getEntradaProgramada())
                    .salidaProgramada(asistencia.getSalidaProgramada())
                    .fechaHoraIngreso(asistencia.getFechaHoraIngreso())
                    .fechaHoraSalida(asistencia.getFechaHoraSalida())
                    .jornadaCerrada(asistencia.getFechaHoraSalida() != null)
                    .operativo(asistencia.getEstadoActual() == EstadoAsistencia.ONLINE && esHoy)
                    .minutosObjetivoDia(asistencia.getMinutosObjetivoDia())
                    .minutosTrabajados(asistencia.getMinutosTrabajados())
                    .minutosBalance(asistencia.getMinutosBalance())
                    .minutosExtra(asistencia.getMinutosExtra())
                    .almuerzoEstadoDesde(asistencia.getAlmuerzoEstadoDesde())
                    .almuerzoRealInicio(asistencia.getAlmuerzoRealInicio())
                    .almuerzoRealFin(asistencia.getAlmuerzoRealFin())
                    .origenAlmuerzo(asistencia.getOrigenAlmuerzo())
                    .minutosAlmuerzoTomados(asistencia.getMinutosAlmuerzoTomados())
                    .minutosServiciosHoy(tot.servicios())
                    .minutosPausaActivaHoy(tot.pausa())
                    .minutosCapacitacionHoy(tot.capacitacion())
                    .sesionEnCurso(tot.enCurso())
                    .build();
        }

        TramoJornadaResponse tramoRef = tramoReferencia(jornada);
        return b
                .idHorario(jornada != null ? jornada.getIdHorario() : null)
                .estadoActual(EstadoAsistencia.OFFLINE)
                .entradaProgramada(tramoRef != null ? tramoRef.getInicio().toLocalTime() : null)
                .salidaProgramada(tramoRef != null ? tramoRef.getFin().toLocalTime() : null)
                .jornadaCerrada(false)
                .operativo(false)
                .minutosObjetivoDia(objetivoJornada(jornada))
                .minutosTrabajados(0)
                .minutosBalance(0)
                .minutosExtra(0)
                .minutosAlmuerzoTomados(0)
                .minutosServiciosHoy(0)
                .minutosPausaActivaHoy(0)
                .minutosCapacitacionHoy(0)
                .sesionEnCurso(false)
                .build();
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
            }
        }
        return new SesionTotales(servicios, pausa, capacitacion, enCurso);
    }

    private record SesionTotales(int servicios, int pausa, int capacitacion, boolean enCurso) {}
}
