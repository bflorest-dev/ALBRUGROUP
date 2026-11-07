package pe.albrugroup.schedule_service.service;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import pe.albrugroup.schedule_service.configuration.CurrentUser;
import pe.albrugroup.schedule_service.configuration.OperationalDateTime;
import pe.albrugroup.schedule_service.entity.Horario;
import pe.albrugroup.schedule_service.entity.HorarioDetalle;
import pe.albrugroup.schedule_service.entity.PoliticaModalidad;
import pe.albrugroup.schedule_service.entity.enums.Dia;
import pe.albrugroup.schedule_service.entity.enums.ModalidadContrato;
import pe.albrugroup.schedule_service.entity.request.horario.BloqueHorarioRequest;
import pe.albrugroup.schedule_service.entity.request.horario.CorregirHorarioRequest;
import pe.albrugroup.schedule_service.entity.request.horario.ReemplazarHorarioRequest;
import pe.albrugroup.schedule_service.entity.response.horario.HorarioResponse;
import pe.albrugroup.schedule_service.exception.ForbiddenException;
import pe.albrugroup.schedule_service.repository.AsistenciaRepository;
import pe.albrugroup.schedule_service.repository.ExcepcionHorarioRepository;
import pe.albrugroup.schedule_service.repository.HorarioRepository;
import pe.albrugroup.schedule_service.service.mapper.HorarioMapper;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class HorarioServiceTest {

    @Mock
    private HorarioRepository horarioRepository;
    @Mock
    private ExcepcionHorarioRepository excepcionHorarioRepository;
    @Mock
    private AsistenciaRepository asistenciaRepository;
    @Mock
    private PoliticaModalidadService politicaModalidadService;
    @Mock
    private PaginationService paginationService;
    @Mock
    private HorarioMapper mapper;
    @Mock
    private CurrentUser currentUser;
    @Mock
    private AttendanceRealtimeNotifier attendanceRealtimeNotifier;

    @InjectMocks
    private HorarioService service;

    @Test
    void rechazaLaCorreccionRetroactivaSiElRolNoEsAdministrador() {
        Horario actual = horarioActual();
        LocalDate fechaNueva = OperationalDateTime.today();
        when(horarioRepository.findById(1L)).thenReturn(Optional.of(actual));
        when(currentUser.roles()).thenReturn(List.of("RRHH"));

        ReemplazarHorarioRequest reemplazo = ReemplazarHorarioRequest.builder()
                .modalidad(ModalidadContrato.FULL_TIME)
                .fechaInicio(fechaNueva)
                .correccionRetroactiva(true)
                .compensable(true)
                .detalles(List.of())
                .build();

        assertThatThrownBy(() -> service.reemplazarHorario(1L, reemplazo))
                .isInstanceOf(ForbiddenException.class)
                .hasMessageContaining("Solo ADMINISTRADOR");

        CorregirHorarioRequest correccion = CorregirHorarioRequest.builder()
                .modalidad(ModalidadContrato.FULL_TIME)
                .correccionRetroactiva(true)
                .compensable(true)
                .detalles(List.of())
                .build();

        assertThatThrownBy(() -> service.corregirHorario(1L, correccion))
                .isInstanceOf(ForbiddenException.class)
                .hasMessageContaining("Solo ADMINISTRADOR");

        verify(asistenciaRepository, never()).existsByIdEmpleadoAndFechaGreaterThanEqual(any(), any());
    }

    @Test
    void administradorPuedeReemplazarUnaVigenciaRetroactivaSinMoverMarcaciones() {
        Horario actual = horarioActual();
        LocalDate fechaNueva = OperationalDateTime.today();
        HorarioDetalle detalle = new HorarioDetalle();
        HorarioResponse response = org.mockito.Mockito.mock(HorarioResponse.class);
        BloqueHorarioRequest bloque = BloqueHorarioRequest.builder()
                .dia(Dia.LUNES)
                .horaEntrada(LocalTime.of(9, 0))
                .horaSalida(LocalTime.of(18, 0))
                .laborable(true)
                .build();

        when(horarioRepository.findById(1L)).thenReturn(Optional.of(actual));
        when(currentUser.roles()).thenReturn(List.of("ADMINISTRADOR"));
        when(asistenciaRepository.existsByIdEmpleadoAndFechaGreaterThanEqual(10L, fechaNueva)).thenReturn(true);
        when(horarioRepository.existsSolapamiento(10L, fechaNueva, null, 1L)).thenReturn(false);
        when(mapper.toDetalle(bloque)).thenReturn(detalle);
        when(horarioRepository.save(any(Horario.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(mapper.toResponse(any(Horario.class))).thenReturn(response);

        ReemplazarHorarioRequest request = ReemplazarHorarioRequest.builder()
                .modalidad(ModalidadContrato.FULL_TIME)
                .fechaInicio(fechaNueva)
                .correccionRetroactiva(true)
                .compensable(true)
                .detalles(List.of(bloque))
                .build();

        HorarioResponse result = service.reemplazarHorario(1L, request);

        assertThat(result).isSameAs(response);
        assertThat(actual.getFechaFin()).isEqualTo(fechaNueva.minusDays(1));
        ArgumentCaptor<Horario> saved = ArgumentCaptor.forClass(Horario.class);
        verify(horarioRepository, org.mockito.Mockito.times(2)).save(saved.capture());
        assertThat(saved.getAllValues().get(1).getFechaInicio()).isEqualTo(fechaNueva);
        verify(asistenciaRepository, never()).existsByIdEmpleadoAndFechaGreaterThanEqual(any(), any());
    }

    private Horario horarioActual() {
        return Horario.builder()
                .id(1L)
                .idEmpleado(10L)
                .idContrato(20L)
                .fechaInicio(OperationalDateTime.today().minusDays(10))
                .build();
    }
}
