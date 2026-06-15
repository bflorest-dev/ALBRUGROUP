package pe.albrugroup.schedule_service.service;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import pe.albrugroup.schedule_service.configuration.CurrentUser;
import pe.albrugroup.schedule_service.configuration.ScheduleEngineProperties;
import pe.albrugroup.schedule_service.entity.ExcepcionHorario;
import pe.albrugroup.schedule_service.entity.Horario;
import pe.albrugroup.schedule_service.entity.HorarioDetalle;
import pe.albrugroup.schedule_service.entity.enums.Dia;
import pe.albrugroup.schedule_service.entity.enums.TipoExcepcionHorario;
import pe.albrugroup.schedule_service.entity.request.horario.RegistrarAmpliacionRequest;
import pe.albrugroup.schedule_service.entity.response.horario.AmpliacionHorarioResponse;
import pe.albrugroup.schedule_service.entity.response.horario.ExcepcionHorarioResponse;
import pe.albrugroup.schedule_service.entity.response.horario.HorarioResponse;
import pe.albrugroup.schedule_service.repository.AsistenciaRepository;
import pe.albrugroup.schedule_service.repository.AsistenciaTramoRepository;
import pe.albrugroup.schedule_service.repository.AjusteJornadaRepository;
import pe.albrugroup.schedule_service.repository.ExcepcionHorarioRepository;
import pe.albrugroup.schedule_service.service.mapper.AsistenciaMapper;
import pe.albrugroup.schedule_service.service.mapper.HorarioMapper;

import java.time.LocalDate;
import java.time.LocalTime;
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
