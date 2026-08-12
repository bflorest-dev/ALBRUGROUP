package pe.albrugroup.schedule_service.service;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import pe.albrugroup.schedule_service.configuration.CurrentUser;
import pe.albrugroup.schedule_service.configuration.OperationalDateTime;
import pe.albrugroup.schedule_service.entity.Asistencia;
import pe.albrugroup.schedule_service.entity.Horario;
import pe.albrugroup.schedule_service.entity.HorarioDetalle;
import pe.albrugroup.schedule_service.entity.SesionEstado;
import pe.albrugroup.schedule_service.entity.enums.Dia;
import pe.albrugroup.schedule_service.entity.enums.EstadoAjusteJornada;
import pe.albrugroup.schedule_service.entity.enums.EstadoAsistencia;
import pe.albrugroup.schedule_service.entity.enums.TipoSesionEstado;
import pe.albrugroup.schedule_service.exception.BadRequestException;
import pe.albrugroup.schedule_service.repository.AjusteJornadaRepository;
import pe.albrugroup.schedule_service.repository.AsistenciaRepository;
import pe.albrugroup.schedule_service.repository.ExcepcionHorarioRepository;
import pe.albrugroup.schedule_service.repository.HorarioRepository;
import pe.albrugroup.schedule_service.repository.SesionEstadoRepository;
import pe.albrugroup.schedule_service.service.ParametroAsistenciaResolver.EffectiveParams;

import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZonedDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicReference;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class MarcacionServiceTest {

    @Mock AsistenciaRepository asistenciaRepository;
    @Mock SesionEstadoRepository sesionEstadoRepository;
    @Mock HorarioRepository horarioRepository;
    @Mock ExcepcionHorarioRepository excepcionRepository;
    @Mock AjusteJornadaRepository ajusteRepository;
    @Mock ParametroAsistenciaResolver parametroAsistenciaResolver;
    @Mock CurrentUser currentUser;
    @Mock AttendanceRealtimeNotifier notifier;

    private static final long EMP = 21L;
    private static final LocalDate DIA = LocalDate.of(2026, 8, 10); // lunes

    private final AtomicReference<Asistencia> almacen = new AtomicReference<>();
    private Horario horario;
    private MarcacionService service;

    @BeforeEach
    void setUp() {
        horario = horarioTodosLosDias(LocalTime.of(8, 0), LocalTime.of(17, 0), LocalTime.of(13, 0), LocalTime.of(14, 0));
        lenient().when(currentUser.empleadoID()).thenReturn(EMP);
        lenient().when(currentUser.roles()).thenReturn(List.of("ASESOR_VENTAS"));
        lenient().when(parametroAsistenciaResolver.resolve(any())).thenReturn(EffectiveParams.builder()
                .margenAdelantoMin(5).toleranciaTardanzaMin(5).bloqueoTardanzaMin(20)
                .maxMinutosPausaActiva(5).maxUsosPausaActivaDia(1).build());
        lenient().when(horarioRepository.findHorarioVigente(EMP, DIA)).thenReturn(Optional.of(horario));
        lenient().when(horarioRepository.findById(7L)).thenReturn(Optional.of(horario));
        lenient().when(excepcionRepository.findByHorarioIdAndFecha(7L, DIA)).thenReturn(Optional.empty());
        lenient().when(ajusteRepository.findByIdEmpleadoAndFechaOperativaAndEstadoOrderByInicioAsc(
                EMP, DIA, EstadoAjusteJornada.ACTIVO)).thenReturn(List.of());
        lenient().when(sesionEstadoRepository.findByAsistenciaIdOrderByInicioAsc(anyLong())).thenReturn(List.of());
        lenient().when(sesionEstadoRepository.findByAsistenciaIdAndTipoOrderByInicioAsc(anyLong(), any()))
                .thenReturn(List.of());
        // El almacen simula la fila: save la guarda, findByIdEmpleadoAndFecha la devuelve (create-then-read).
        lenient().when(asistenciaRepository.save(any(Asistencia.class))).thenAnswer(i -> {
            Asistencia a = i.getArgument(0);
            if (a.getId() == null) a.setId(1L);
            almacen.set(a);
            return a;
        });
        lenient().when(asistenciaRepository.findByIdEmpleadoAndFecha(EMP, DIA))
                .thenAnswer(i -> Optional.ofNullable(almacen.get()));
    }

    @AfterEach
    void tearDown() {
        OperationalDateTime.useClock(Clock.systemDefaultZone());
    }

    // ===================== Ingreso: ventana (margen / tolerancia / bloqueo) =====================

    @Test
    void ingresoPuntualCreaOnlineConObjetivoNeto() {
        reloj(8, 0);
        service.registrarIngreso();

        Asistencia a = almacen.get();
        assertThat(a.getEstadoActual()).isEqualTo(EstadoAsistencia.ONLINE);
        assertThat(a.getFechaHoraIngreso()).isEqualTo(LocalDateTime.of(2026, 8, 10, 8, 0));
        // Objetivo = jornada neta: (17:00-8:00) 540 - almuerzo 60 = 480.
        assertThat(a.getMinutosObjetivoDia()).isEqualTo(480);
    }

    @Test
    void ingresoAdelantadoDentroDelMargenSePermite() {
        reloj(7, 56); // 4 min antes, margen 5
        service.registrarIngreso();
        assertThat(almacen.get().getEstadoActual()).isEqualTo(EstadoAsistencia.ONLINE);
    }

    @Test
    void ingresoDemasiadoAdelantadoSeBloquea() {
        reloj(7, 50); // 10 min antes, margen 5
        assertThatThrownBy(() -> service.registrarIngreso())
                .isInstanceOf(BadRequestException.class);
        assertThat(almacen.get()).isNull();
    }

    @Test
    void ingresoConTardanzaMayorAlBloqueoSeRechaza() {
        reloj(8, 25); // 25 min tarde, bloqueo 20
        assertThatThrownBy(() -> service.registrarIngreso())
                .isInstanceOf(BadRequestException.class);
    }

    @Test
    void ingresoConTardanzaDentroDelBloqueoSePermite() {
        reloj(8, 14); // 14 min tarde (< 20): permitido, sera tardanza en el reporte
        service.registrarIngreso();
        assertThat(almacen.get().getEstadoActual()).isEqualTo(EstadoAsistencia.ONLINE);
        assertThat(almacen.get().getFechaHoraIngreso()).isEqualTo(LocalDateTime.of(2026, 8, 10, 8, 14));
    }

    // ===================== Salida: topes de entrada/salida y balance =====================

    @Test
    void salidaConAlmuerzoCompletoDaBalanceCero() {
        reloj(17, 0);
        almacen.set(asistenciaOnline(LocalDateTime.of(2026, 8, 10, 8, 0), 60));
        service.registrarSalida();

        Asistencia a = almacen.get();
        assertThat(a.getEstadoActual()).isEqualTo(EstadoAsistencia.OFFLINE);
        assertThat(a.getMinutosTrabajados()).isEqualTo(480); // 540 - 60 almuerzo
        assertThat(a.getMinutosBalance()).isZero();
    }

    @Test
    void sobreconsumoDeAlmuerzoDaBalanceNegativo() {
        reloj(17, 0);
        almacen.set(asistenciaOnline(LocalDateTime.of(2026, 8, 10, 8, 0), 72)); // 12 min de mas
        service.registrarSalida();
        assertThat(almacen.get().getMinutosBalance()).isEqualTo(-12);
    }

    @Test
    void trabajarDespuesDeLaSalidaSeTopaYNoDaPositivo() {
        reloj(17, 30); // marca salida 30 min despues del horario
        almacen.set(asistenciaOnline(LocalDateTime.of(2026, 8, 10, 8, 0), 60));
        service.registrarSalida();
        // Tope de salida en 17:00: trabajados = 480, balance = 0 (nunca positivo).
        assertThat(almacen.get().getMinutosTrabajados()).isEqualTo(480);
        assertThat(almacen.get().getMinutosBalance()).isZero();
    }

    @Test
    void noSePuedeMarcarSalidaConPausaActiva() {
        reloj(15, 0);
        Asistencia a = asistenciaOnline(LocalDateTime.of(2026, 8, 10, 8, 0), 0);
        a.setEstadoActual(EstadoAsistencia.SERVICIOS);
        almacen.set(a);
        assertThatThrownBy(() -> service.registrarSalida())
                .isInstanceOf(BadRequestException.class);
    }

    // ===================== Estados cronometrados: topes =====================

    @Test
    void serviciosSeBloqueaTrasSuperarElTope() {
        reloj(10, 0);
        almacen.set(asistenciaOnline(LocalDateTime.of(2026, 8, 10, 8, 0), 0));
        // Ya consumio 15 min (una sesion cerrada); cap = 15.
        when(sesionEstadoRepository.findByAsistenciaIdAndTipoOrderByInicioAsc(1L, TipoSesionEstado.SERVICIOS))
                .thenReturn(List.of(sesionCerrada(TipoSesionEstado.SERVICIOS, LocalTime.of(9, 0), LocalTime.of(9, 15))));

        assertThatThrownBy(() -> service.iniciarServicios())
                .isInstanceOf(BadRequestException.class);
    }

    @Test
    void pausaActivaSegundaVezSeBloquea() {
        reloj(10, 0);
        almacen.set(asistenciaOnline(LocalDateTime.of(2026, 8, 10, 8, 0), 0));
        // Ya uso su pausa (1 sesion); max = 1.
        when(sesionEstadoRepository.findByAsistenciaIdAndTipoOrderByInicioAsc(1L, TipoSesionEstado.PAUSA_ACTIVA))
                .thenReturn(List.of(sesionCerrada(TipoSesionEstado.PAUSA_ACTIVA, LocalTime.of(9, 0), LocalTime.of(9, 5))));

        assertThatThrownBy(() -> service.iniciarPausaActiva())
                .isInstanceOf(BadRequestException.class);
    }

    // ===================== Almuerzo: ventana y contador =====================

    @Test
    void almuerzoAntesDeLaVentanaSeBloquea() {
        reloj(12, 30); // almuerzo 13:00; ventana desde 12:45
        almacen.set(asistenciaOnline(LocalDateTime.of(2026, 8, 10, 8, 0), 0));
        assertThatThrownBy(() -> service.iniciarAlmuerzo(null))
                .isInstanceOf(BadRequestException.class);
    }

    @Test
    void almuerzoConBandejaVaciaArrancaContadorYFinCalculaMinutos() {
        reloj(13, 0);
        almacen.set(asistenciaOnline(LocalDateTime.of(2026, 8, 10, 8, 0), 0));
        service.iniciarAlmuerzo(pe.albrugroup.schedule_service.entity.request.asistencia.IniciarAlmuerzoRequest.builder()
                .bandejaVacia(true).build());
        assertThat(almacen.get().getEstadoActual()).isEqualTo(EstadoAsistencia.ALMUERZO);
        assertThat(almacen.get().getAlmuerzoRealInicio()).isEqualTo(LocalDateTime.of(2026, 8, 10, 13, 0));

        reloj(14, 12); // vuelve 72 min despues
        service.finalizarAlmuerzo();
        assertThat(almacen.get().getEstadoActual()).isEqualTo(EstadoAsistencia.ONLINE);
        assertThat(almacen.get().getMinutosAlmuerzoTomados()).isEqualTo(72);
    }

    // ===================== helpers =====================

    private void reloj(int hh, int mm) {
        Clock clock = Clock.fixed(
                ZonedDateTime.of(2026, 8, 10, hh, mm, 0, 0, OperationalDateTime.ZONE).toInstant(),
                OperationalDateTime.ZONE);
        OperationalDateTime.useClock(clock);
        JornadaEfectivaResolver resolver = new JornadaEfectivaResolver(
                horarioRepository, excepcionRepository, ajusteRepository, clock);
        service = new MarcacionService(asistenciaRepository, sesionEstadoRepository, resolver,
                parametroAsistenciaResolver, horarioRepository, currentUser, notifier);
    }

    private Horario horarioTodosLosDias(LocalTime entrada, LocalTime salida, LocalTime almIn, LocalTime almOut) {
        List<HorarioDetalle> detalles = Arrays.stream(Dia.values())
                .map(d -> HorarioDetalle.builder()
                        .dia(d).laborable(true)
                        .horaEntrada(entrada).horaSalida(salida)
                        .inicioAlmuerzo(almIn).finAlmuerzo(almOut)
                        .build())
                .toList();
        return Horario.builder().id(7L).idEmpleado(EMP).minutosServicios(15).detalles(detalles).build();
    }

    private Asistencia asistenciaOnline(LocalDateTime ingreso, int minutosAlmuerzo) {
        return Asistencia.builder()
                .id(1L).idEmpleado(EMP).idHorario(7L).fecha(DIA)
                .estadoActual(EstadoAsistencia.ONLINE)
                .entradaProgramada(LocalTime.of(8, 0)).salidaProgramada(LocalTime.of(17, 0))
                .inicioAlmuerzoProgramado(LocalTime.of(13, 0)).finAlmuerzoProgramado(LocalTime.of(14, 0))
                .fechaHoraIngreso(ingreso)
                .minutosObjetivoDia(480).minutosTrabajados(0).minutosBalance(0)
                .minutosAlmuerzoTomados(minutosAlmuerzo)
                .minutosServiciosPermitidos(15).minutosServiciosAcumulados(0).excedioServicios(false)
                .minutosExtra(0)
                .build();
    }

    private SesionEstado sesionCerrada(TipoSesionEstado tipo, LocalTime inicio, LocalTime fin) {
        return SesionEstado.builder()
                .tipo(tipo)
                .inicio(LocalDateTime.of(DIA, inicio))
                .fin(LocalDateTime.of(DIA, fin))
                .build();
    }
}
