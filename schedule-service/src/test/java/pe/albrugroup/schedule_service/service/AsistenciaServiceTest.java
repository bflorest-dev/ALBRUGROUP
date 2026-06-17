package pe.albrugroup.schedule_service.service;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import pe.albrugroup.schedule_service.configuration.CurrentUser;
import pe.albrugroup.schedule_service.configuration.OperationalDateTime;
import pe.albrugroup.schedule_service.configuration.ScheduleEngineProperties;
import pe.albrugroup.schedule_service.entity.AjusteJornada;
import pe.albrugroup.schedule_service.entity.Asistencia;
import pe.albrugroup.schedule_service.entity.AsistenciaTramo;
import pe.albrugroup.schedule_service.entity.ExcepcionHorario;
import pe.albrugroup.schedule_service.entity.Horario;
import pe.albrugroup.schedule_service.entity.HorarioDetalle;
import pe.albrugroup.schedule_service.entity.enums.Dia;
import pe.albrugroup.schedule_service.entity.enums.EstadoAsistencia;
import pe.albrugroup.schedule_service.entity.enums.OrigenAjusteJornada;
import pe.albrugroup.schedule_service.entity.enums.OrigenTramo;
import pe.albrugroup.schedule_service.entity.enums.TipoExcepcionHorario;
import pe.albrugroup.schedule_service.entity.request.asistencia.MovimientoAsistenciaRequest;
import pe.albrugroup.schedule_service.entity.request.horario.RegistrarAmpliacionRequest;
import pe.albrugroup.schedule_service.entity.response.asistencia.DetalleAsistenciaResponse;
import pe.albrugroup.schedule_service.entity.response.horario.AmpliacionHorarioResponse;
import pe.albrugroup.schedule_service.entity.response.horario.ExcepcionHorarioResponse;
import pe.albrugroup.schedule_service.entity.response.horario.HorarioResponse;
import pe.albrugroup.schedule_service.entity.response.horario.JornadaEfectivaResponse;
import pe.albrugroup.schedule_service.entity.response.horario.TramoJornadaResponse;
import pe.albrugroup.schedule_service.repository.AsistenciaRepository;
import pe.albrugroup.schedule_service.repository.AsistenciaTramoRepository;
import pe.albrugroup.schedule_service.repository.AjusteJornadaRepository;
import pe.albrugroup.schedule_service.repository.ExcepcionHorarioRepository;
import pe.albrugroup.schedule_service.service.mapper.AsistenciaMapper;
import pe.albrugroup.schedule_service.service.mapper.HorarioMapper;

import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZonedDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AsistenciaServiceTest {

    @Mock
    private AsistenciaRepository asistenciaRepository;
    @Mock
    private AsistenciaTramoRepository asistenciaTramoRepository;
    @Mock
    private AjusteJornadaRepository ajusteJornadaRepository;
    @Mock
    private ExcepcionHorarioRepository excepcionHorarioRepository;
    @Mock
    private HorarioService horarioService;
    @Mock
    private AttendanceMonitorResolver attendanceMonitorResolver;
    @Mock
    private AttendanceRealtimeNotifier attendanceRealtimeNotifier;
    @Mock
    private AsistenciaMapper mapper;
    @Mock
    private HorarioMapper horarioMapper;
    @Mock
    private CurrentUser currentUser;
    @Mock
    private AjusteJornadaService ajusteJornadaService;
    @Mock
    private JornadaEfectivaResolver jornadaEfectivaResolver;
    @Mock
    private ScheduleEngineProperties scheduleEngineProperties;
    @Mock
    private JornadaShadowComparator jornadaShadowComparator;

    @InjectMocks
    private AsistenciaService service;

    @Test
    void permiteNuevoIngresoCuandoUnAjusteExtiendeUnaJornadaCerrada() {
        LocalDate fecha = LocalDate.of(2026, 6, 15);
        LocalDateTime ahora = LocalDateTime.of(2026, 6, 15, 17, 10);
        Clock fixedClock = Clock.fixed(
                ZonedDateTime.of(2026, 6, 15, 17, 10, 0, 0, OperationalDateTime.ZONE).toInstant(),
                OperationalDateTime.ZONE);
        OperationalDateTime.useClock(fixedClock);

        Asistencia asistencia = Asistencia.builder()
                .id(1L)
                .idEmpleado(21L)
                .idHorario(7L)
                .fecha(fecha)
                .estadoActual(EstadoAsistencia.OFFLINE)
                .entradaProgramada(LocalTime.of(9, 0))
                .salidaProgramada(LocalTime.of(15, 0))
                .fechaHoraIngreso(LocalDateTime.of(2026, 6, 15, 9, 2))
                .fechaHoraSalida(LocalDateTime.of(2026, 6, 15, 15, 3))
                .minutosObjetivoDia(360)
                .minutosTrabajados(350)
                .minutosBalance(-10)
                .minutosAlmuerzoTomados(0)
                .minutosServiciosPermitidos(20)
                .minutosServiciosAcumulados(0)
                .excedioServicios(false)
                .origenTramoActual(OrigenTramo.BASE)
                .build();
        TramoJornadaResponse tramoExtendido = TramoJornadaResponse.builder()
                .idAjuste(77L)
                .inicio(LocalDateTime.of(2026, 6, 15, 9, 0))
                .fin(LocalDateTime.of(2026, 6, 15, 18, 0))
                .origen(OrigenAjusteJornada.REEMPLAZO_BASE)
                .base(false)
                .motivo("Extension operativa")
                .build();
        JornadaEfectivaResponse jornada = JornadaEfectivaResponse.builder()
                .idEmpleado(21L)
                .idHorario(7L)
                .fecha(fecha)
                .tramos(List.of(tramoExtendido))
                .tramoActual(tramoExtendido)
                .build();
        AjusteJornada ajuste = AjusteJornada.builder().id(77L).build();

        try {
            when(currentUser.empleadoID()).thenReturn(21L);
            when(scheduleEngineProperties.enabledForOperationalReads(fecha)).thenReturn(true);
            when(jornadaEfectivaResolver.resolver(21L, fecha)).thenReturn(jornada);
            when(asistenciaRepository.findByIdEmpleadoAndFecha(21L, fecha)).thenReturn(Optional.of(asistencia));
            when(asistenciaTramoRepository.findByAsistenciaIdOrderByIdAsc(1L)).thenReturn(List.of());
            when(ajusteJornadaRepository.findById(77L)).thenReturn(Optional.of(ajuste));
            when(asistenciaTramoRepository.save(any(AsistenciaTramo.class))).thenAnswer(invocation -> invocation.getArgument(0));
            when(asistenciaRepository.save(any(Asistencia.class))).thenAnswer(invocation -> invocation.getArgument(0));
            when(mapper.toDetalleResponse(any(Asistencia.class))).thenReturn(DetalleAsistenciaResponse.builder().build());

            service.registrarIngreso(MovimientoAsistenciaRequest.builder().build());

            ArgumentCaptor<AsistenciaTramo> tramoArchivado = ArgumentCaptor.forClass(AsistenciaTramo.class);
            verify(asistenciaTramoRepository).save(tramoArchivado.capture());
            assertThat(tramoArchivado.getValue().getEntradaProgramada()).isEqualTo(LocalTime.of(9, 0));
            assertThat(tramoArchivado.getValue().getSalidaProgramada()).isEqualTo(LocalTime.of(15, 0));
            assertThat(asistencia.getEntradaProgramada()).isEqualTo(LocalTime.of(15, 0));
            assertThat(asistencia.getSalidaProgramada()).isEqualTo(LocalTime.of(18, 0));
            assertThat(asistencia.getFechaHoraIngreso()).isEqualTo(ahora);
            assertThat(asistencia.getFechaHoraSalida()).isNull();
            assertThat(asistencia.getEstadoActual()).isEqualTo(EstadoAsistencia.ONLINE);
            assertThat(asistencia.getOrigenTramoActual()).isEqualTo(OrigenTramo.REEMPLAZO_BASE);
        } finally {
            OperationalDateTime.useClock(Clock.system(OperationalDateTime.ZONE));
        }
    }

    @Test
    void habilitaJornadaExtraordinariaEnDiaDeDescanso() {
        LocalDate domingo = LocalDate.of(2026, 6, 14);
        LocalTime entrada = LocalTime.of(9, 0);
        LocalTime salida = LocalTime.of(15, 0);
        Horario horario = Horario.builder()
                .id(7L)
                .idEmpleado(21L)
                .minutosServicios(20)
                .detalles(List.of(HorarioDetalle.builder()
                        .dia(Dia.DOMINGO)
                        .horaEntrada(entrada)
                        .horaSalida(salida)
                        .laborable(false)
                        .build()))
                .build();

        when(horarioService.getHorarioVigente(21L, domingo))
                .thenReturn(HorarioResponse.builder().id(7L).build());
        when(scheduleEngineProperties.getMode()).thenReturn(ScheduleEngineProperties.Mode.LEGACY);
        when(horarioService.getHorarioById(7L)).thenReturn(horario);
        when(excepcionHorarioRepository.findByHorarioIdAndFecha(7L, domingo))
                .thenReturn(Optional.empty());
        when(currentUser.empleadoID()).thenReturn(99L);
        when(excepcionHorarioRepository.save(any(ExcepcionHorario.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
        when(horarioMapper.toResponse(any(ExcepcionHorario.class)))
                .thenReturn(ExcepcionHorarioResponse.builder().build());

        AmpliacionHorarioResponse response = service.registrarAmpliacion(
                21L,
                RegistrarAmpliacionRequest.builder()
                        .fecha(domingo)
                        .horaEntrada(entrada)
                        .horaSalida(salida)
                        .motivo("Cobertura extraordinaria")
                        .build()
        );

        ArgumentCaptor<ExcepcionHorario> captor = ArgumentCaptor.forClass(ExcepcionHorario.class);
        verify(excepcionHorarioRepository).save(captor.capture());
        ExcepcionHorario saved = captor.getValue();

        assertThat(saved.getTipo()).isEqualTo(TipoExcepcionHorario.AMPLIACION);
        assertThat(saved.getLaborable()).isTrue();
        assertThat(saved.getHoraEntrada()).isEqualTo(entrada);
        assertThat(saved.getHoraSalida()).isEqualTo(salida);
        assertThat(saved.getCreadoPor()).isEqualTo(99L);
        assertThat(response.getResultado()).isEqualTo("HABILITADA");
        assertThat(response.getEntradaEfectiva()).isEqualTo(entrada);
        assertThat(response.getSalidaEfectiva()).isEqualTo(salida);
        verify(attendanceRealtimeNotifier).publishAfterCommit(
                "EXCEPCION_HORARIO_AFECTADA",
                "EXCEPCION",
                21L,
                domingo,
                null
        );
    }
}
