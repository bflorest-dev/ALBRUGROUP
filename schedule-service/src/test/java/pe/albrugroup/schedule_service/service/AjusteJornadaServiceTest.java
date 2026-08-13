package pe.albrugroup.schedule_service.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import pe.albrugroup.schedule_service.configuration.CurrentUser;
import pe.albrugroup.schedule_service.configuration.OperationalDateTime;
import pe.albrugroup.schedule_service.configuration.ScheduleEngineProperties;
import pe.albrugroup.schedule_service.entity.AjusteJornada;
import pe.albrugroup.schedule_service.entity.Asistencia;
import pe.albrugroup.schedule_service.entity.Horario;
import pe.albrugroup.schedule_service.entity.HorarioDetalle;
import pe.albrugroup.schedule_service.entity.enums.*;
import pe.albrugroup.schedule_service.entity.request.horario.AjusteJornadaRequest;
import pe.albrugroup.schedule_service.entity.request.horario.RegistrarAjusteRequest;
import pe.albrugroup.schedule_service.entity.response.horario.AjusteJornadaResponse;
import pe.albrugroup.schedule_service.entity.response.horario.JornadaEfectivaResponse;
import pe.albrugroup.schedule_service.repository.*;

import java.time.*;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AjusteJornadaServiceTest {

    @Mock AjusteJornadaRepository ajusteRepository;
    @Mock HorarioRepository horarioRepository;
    @Mock ExcepcionHorarioRepository excepcionRepository;
    @Mock AsistenciaRepository asistenciaRepository;
    @Mock DiaNoLaborableRepository diaNoLaborableRepository;
    @Mock AttendanceRealtimeNotifier notifier;
    @Mock CurrentUser currentUser;

    private final Clock clock = Clock.fixed(
            ZonedDateTime.of(2026, 6, 15, 8, 10, 0, 0, OperationalDateTime.ZONE).toInstant(),
            OperationalDateTime.ZONE
    );
    private ScheduleEngineProperties properties;
    private AjusteJornadaService service;

    @BeforeEach
    void setUp() {
        properties = new ScheduleEngineProperties();
        properties.setMode(ScheduleEngineProperties.Mode.ADMIN);
        properties.setEffectiveFrom(LocalDate.of(2026, 6, 15));
        lenient().when(diaNoLaborableRepository.findByFecha(any())).thenReturn(List.of());
        JornadaEfectivaResolver resolver = new JornadaEfectivaResolver(
                horarioRepository, excepcionRepository, ajusteRepository, diaNoLaborableRepository, clock);
        service = new AjusteJornadaService(
                ajusteRepository,
                horarioRepository,
                asistenciaRepository,
                resolver,
                notifier,
                currentUser,
                properties,
                clock
        );
        lenient().when(currentUser.empleadoID()).thenReturn(99L);
        lenient().when(ajusteRepository.save(any(AjusteJornada.class))).thenAnswer(invocation -> {
            AjusteJornada ajuste = invocation.getArgument(0);
            if (ajuste.getId() == null) ajuste.setId(100L);
            return ajuste;
        });
    }

    @Test
    void habilitaDiaDeDescansoComoJornadaExtraordinaria() {
        Horario horario = horario(false, LocalTime.of(9, 0), LocalTime.of(15, 0));
        prepararHorario(horario);

        AjusteJornadaResponse response = service.registrar(
                21L,
                request("2026-06-15T08:15:00", "2026-06-15T15:00:00")
        );

        assertThat(response.getOrigen()).isEqualTo(OrigenAjusteJornada.JORNADA_EXTRAORDINARIA);
        assertThat(response.getInicio()).isEqualTo(LocalDateTime.of(2026, 6, 15, 8, 15));
    }

    @Test
    void reemplazaCompletamenteElAjusteAnteriorSolapado() {
        Horario horario = horario(false, LocalTime.of(9, 0), LocalTime.of(15, 0));
        prepararHorario(horario);
        AjusteJornada anterior = AjusteJornada.builder()
                .id(7L)
                .idEmpleado(21L)
                .horario(horario)
                .fechaOperativa(LocalDate.of(2026, 6, 15))
                .inicio(LocalDateTime.of(2026, 6, 15, 8, 15))
                .fin(LocalDateTime.of(2026, 6, 15, 15, 0))
                .estado(EstadoAjusteJornada.ACTIVO)
                .origen(OrigenAjusteJornada.JORNADA_EXTRAORDINARIA)
                .motivo("Primera solicitud")
                .creadoPor(99L)
                .build();
        when(ajusteRepository.findForUpdateByIdEmpleadoAndFechaOperativaAndEstado(
                21L, LocalDate.of(2026, 6, 15), EstadoAjusteJornada.ACTIVO))
                .thenReturn(List.of(anterior));

        AjusteJornadaResponse response = service.registrar(
                21L,
                request("2026-06-15T08:00:00", "2026-06-15T15:15:00")
        );

        assertThat(anterior.getEstado()).isEqualTo(EstadoAjusteJornada.REEMPLAZADO);
        assertThat(anterior.getReemplazadoPor().getId()).isEqualTo(response.getId());
        verify(ajusteRepository).saveAll(List.of(anterior));
    }

    @Test
    void conservaInicioProgramadoCuandoLaJornadaYaEmpezo() {
        Horario horario = horario(true, LocalTime.of(9, 0), LocalTime.of(15, 0));
        prepararHorario(horario);
        Asistencia asistencia = Asistencia.builder()
                .id(1L)
                .idEmpleado(21L)
                .idHorario(7L)
                .fecha(LocalDate.of(2026, 6, 15))
                .estadoActual(EstadoAsistencia.ONLINE)
                .entradaProgramada(LocalTime.of(9, 0))
                .salidaProgramada(LocalTime.of(15, 0))
                .fechaHoraIngreso(LocalDateTime.of(2026, 6, 15, 9, 2))
                .minutosObjetivoDia(360)
                .minutosTrabajados(0)
                .minutosBalance(-360)
                .minutosAlmuerzoTomados(0)
                .minutosServiciosPermitidos(20)
                .minutosServiciosAcumulados(0)
                .excedioServicios(false)
                .build();
        when(asistenciaRepository.findByIdEmpleadoAndFecha(21L, LocalDate.of(2026, 6, 15)))
                .thenReturn(Optional.of(asistencia));

        AjusteJornadaResponse response = service.registrar(
                21L,
                request("2026-06-15T08:00:00", "2026-06-15T18:00:00")
        );

        assertThat(response.getInicio()).isEqualTo(LocalDateTime.of(2026, 6, 15, 9, 0));
        assertThat(asistencia.getSalidaProgramada()).isEqualTo(LocalTime.of(18, 0));
    }

    @Test
    void reemplazaAjusteAnteriorAunqueElSolapamientoSeaParcial() {
        Horario horario = horario(true, LocalTime.of(8, 0), LocalTime.of(12, 0));
        prepararHorario(horario);
        AjusteJornada anterior = AjusteJornada.builder()
                .id(8L)
                .idEmpleado(21L)
                .horario(horario)
                .fechaOperativa(LocalDate.of(2026, 6, 15))
                .inicio(LocalDateTime.of(2026, 6, 15, 8, 0))
                .fin(LocalDateTime.of(2026, 6, 15, 12, 0))
                .estado(EstadoAjusteJornada.ACTIVO)
                .origen(OrigenAjusteJornada.REEMPLAZO_BASE)
                .motivo("Primer ajuste")
                .creadoPor(99L)
                .build();
        when(ajusteRepository.findForUpdateByIdEmpleadoAndFechaOperativaAndEstado(
                21L, LocalDate.of(2026, 6, 15), EstadoAjusteJornada.ACTIVO))
                .thenReturn(List.of(anterior));

        service.registrar(21L, request("2026-06-15T11:00:00", "2026-06-15T15:00:00"));

        assertThat(anterior.getEstado()).isEqualTo(EstadoAjusteJornada.REEMPLAZADO);
        verify(ajusteRepository).saveAll(List.of(anterior));
    }

    @Test
    void conservaHorarioBaseYAgregaUnTramoPosteriorNoSolapado() {
        Horario horario = horario(true, LocalTime.of(9, 0), LocalTime.of(15, 0));
        AjusteJornada adicional = AjusteJornada.builder()
                .id(9L)
                .idEmpleado(21L)
                .horario(horario)
                .fechaOperativa(LocalDate.of(2026, 6, 15))
                .inicio(LocalDateTime.of(2026, 6, 15, 17, 0))
                .fin(LocalDateTime.of(2026, 6, 15, 19, 0))
                .estado(EstadoAjusteJornada.ACTIVO)
                .origen(OrigenAjusteJornada.TRAMO_ADICIONAL)
                .motivo("Segundo periodo")
                .creadoPor(99L)
                .build();
        when(excepcionRepository.findByHorarioIdAndFecha(7L, LocalDate.of(2026, 6, 15)))
                .thenReturn(Optional.empty());

        JornadaEfectivaResponse jornada = new JornadaEfectivaResolver(
                horarioRepository, excepcionRepository, ajusteRepository, diaNoLaborableRepository, clock)
                .resolver(horario, LocalDate.of(2026, 6, 15), List.of(adicional));

        assertThat(jornada.getTramos()).hasSize(2);
        assertThat(jornada.getTramos().get(0).getBase()).isTrue();
        assertThat(jornada.getTramos().get(1).getOrigen())
                .isEqualTo(OrigenAjusteJornada.TRAMO_ADICIONAL);
    }

    // ===================== Compensacion (razon COMPENSACION, precondicion de deficit) =====================

    @Test
    void compensacionSeRegistraCuandoHayDeficitYCabe() {
        prepararHorario(horario(true, LocalTime.of(8, 0), LocalTime.of(17, 0)));
        lenient().when(currentUser.roles()).thenReturn(List.of("RRHH"));
        when(asistenciaRepository.findByIdEmpleadoAndFechaBetweenOrderByFechaAsc(
                21L, LocalDate.of(2026, 6, 1), LocalDate.of(2026, 6, 30)))
                .thenReturn(List.of(asistenciaConBalance(-30)));

        AjusteJornadaResponse response = service.registrarV2(
                21L, requestV2("2026-06-15T19:00:00", "2026-06-15T19:30:00", RazonAjuste.COMPENSACION));

        assertThat(response.getOrigen()).isEqualTo(OrigenAjusteJornada.TRAMO_ADICIONAL);
    }

    @Test
    void compensacionSinDeficitDelMesSeRechaza() {
        prepararHorarioVigente(horario(true, LocalTime.of(8, 0), LocalTime.of(17, 0)));
        lenient().when(currentUser.roles()).thenReturn(List.of("RRHH"));
        when(asistenciaRepository.findByIdEmpleadoAndFechaBetweenOrderByFechaAsc(
                21L, LocalDate.of(2026, 6, 1), LocalDate.of(2026, 6, 30)))
                .thenReturn(List.of(asistenciaConBalance(0)));

        org.assertj.core.api.Assertions.assertThatThrownBy(() -> service.registrarV2(
                        21L, requestV2("2026-06-15T19:00:00", "2026-06-15T19:30:00", RazonAjuste.COMPENSACION)))
                .isInstanceOf(pe.albrugroup.schedule_service.exception.BadRequestException.class)
                .hasMessageContaining("no debe horas");
    }

    @Test
    void compensacionQueExcedeElDeficitSeRechaza() {
        prepararHorarioVigente(horario(true, LocalTime.of(8, 0), LocalTime.of(17, 0)));
        lenient().when(currentUser.roles()).thenReturn(List.of("RRHH"));
        when(asistenciaRepository.findByIdEmpleadoAndFechaBetweenOrderByFechaAsc(
                21L, LocalDate.of(2026, 6, 1), LocalDate.of(2026, 6, 30)))
                .thenReturn(List.of(asistenciaConBalance(-30)));

        org.assertj.core.api.Assertions.assertThatThrownBy(() -> service.registrarV2(
                        21L, requestV2("2026-06-15T19:00:00", "2026-06-15T20:00:00", RazonAjuste.COMPENSACION)))
                .isInstanceOf(pe.albrugroup.schedule_service.exception.BadRequestException.class)
                .hasMessageContaining("excede el deficit");
    }

    @Test
    void compensacionQueReemplazaLaBaseSeRechaza() {
        prepararHorarioVigente(horario(true, LocalTime.of(8, 0), LocalTime.of(17, 0)));
        lenient().when(currentUser.roles()).thenReturn(List.of("RRHH"));

        org.assertj.core.api.Assertions.assertThatThrownBy(() -> service.registrarV2(
                        21L, requestV2("2026-06-15T08:00:00", "2026-06-15T09:00:00", RazonAjuste.COMPENSACION)))
                .isInstanceOf(pe.albrugroup.schedule_service.exception.BadRequestException.class)
                .hasMessageContaining("no reemplaza el base");
    }

    private Asistencia asistenciaConBalance(int balance) {
        return Asistencia.builder()
                .id(1L).idEmpleado(21L).idHorario(7L).fecha(LocalDate.of(2026, 6, 10))
                .estadoActual(EstadoAsistencia.OFFLINE)
                .entradaProgramada(LocalTime.of(8, 0)).salidaProgramada(LocalTime.of(17, 0))
                .minutosObjetivoDia(480).minutosTrabajados(480 + balance).minutosBalance(balance)
                .minutosAlmuerzoTomados(0).minutosServiciosPermitidos(15).minutosServiciosAcumulados(0)
                .excedioServicios(false).build();
    }

    private RegistrarAjusteRequest requestV2(String inicio, String fin, RazonAjuste razon) {
        return RegistrarAjusteRequest.builder()
                .inicio(LocalDateTime.parse(inicio))
                .fin(LocalDateTime.parse(fin))
                .motivo("Compensa deficit")
                .razon(razon)
                .build();
    }

    /** Solo lo que necesita validarYNormalizar/resolverBase (sin los locks del camino feliz). */
    private void prepararHorarioVigente(Horario horario) {
        when(horarioRepository.findHorarioVigente(21L, LocalDate.of(2026, 6, 15)))
                .thenReturn(Optional.of(horario));
        when(excepcionRepository.findByHorarioIdAndFecha(7L, LocalDate.of(2026, 6, 15)))
                .thenReturn(Optional.empty());
    }

    private void prepararHorario(Horario horario) {
        when(horarioRepository.findHorarioVigente(21L, LocalDate.of(2026, 6, 15)))
                .thenReturn(Optional.of(horario));
        when(horarioRepository.findByIdForUpdate(horario.getId()))
                .thenReturn(Optional.of(horario));
        when(excepcionRepository.findByHorarioIdAndFecha(7L, LocalDate.of(2026, 6, 15)))
                .thenReturn(Optional.empty());
        when(ajusteRepository.findForUpdateByIdEmpleadoAndFechaOperativaAndEstado(
                21L, LocalDate.of(2026, 6, 15), EstadoAjusteJornada.ACTIVO))
                .thenReturn(List.of());
    }

    private Horario horario(boolean laborable, LocalTime entrada, LocalTime salida) {
        return Horario.builder()
                .id(7L)
                .idEmpleado(21L)
                .detalles(List.of(HorarioDetalle.builder()
                        .dia(Dia.LUNES)
                        .laborable(laborable)
                        .horaEntrada(entrada)
                        .horaSalida(salida)
                        .build()))
                .build();
    }

    private AjusteJornadaRequest request(String inicio, String fin) {
        return AjusteJornadaRequest.builder()
                .inicio(LocalDateTime.parse(inicio))
                .fin(LocalDateTime.parse(fin))
                .motivo("Necesidad operativa")
                .build();
    }
}
