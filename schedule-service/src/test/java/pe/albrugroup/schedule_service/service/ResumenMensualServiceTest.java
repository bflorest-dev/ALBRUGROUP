package pe.albrugroup.schedule_service.service;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import pe.albrugroup.schedule_service.configuration.OperationalDateTime;
import pe.albrugroup.schedule_service.entity.AjusteJornada;
import pe.albrugroup.schedule_service.entity.Asistencia;
import pe.albrugroup.schedule_service.entity.Horario;
import pe.albrugroup.schedule_service.entity.HorarioDetalle;
import pe.albrugroup.schedule_service.entity.ResumenAsistenciaMensual;
import pe.albrugroup.schedule_service.entity.enums.Dia;
import pe.albrugroup.schedule_service.entity.enums.EstadoAjusteJornada;
import pe.albrugroup.schedule_service.entity.enums.EstadoAsistencia;
import pe.albrugroup.schedule_service.entity.enums.RazonAjuste;
import pe.albrugroup.schedule_service.entity.response.asistencia.ResumenMensualResponse;
import pe.albrugroup.schedule_service.exception.BadRequestException;
import pe.albrugroup.schedule_service.repository.AjusteJornadaRepository;
import pe.albrugroup.schedule_service.repository.AsistenciaRepository;
import pe.albrugroup.schedule_service.repository.DiaNoLaborableRepository;
import pe.albrugroup.schedule_service.repository.ExcepcionHorarioRepository;
import pe.albrugroup.schedule_service.repository.HorarioRepository;
import pe.albrugroup.schedule_service.repository.ResumenAsistenciaMensualRepository;
import pe.albrugroup.schedule_service.service.ParametroAsistenciaResolver.EffectiveParams;

import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZonedDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Fase 3.4.a: derivacion + cierre perezoso del resumen mensual. Reloj fijo (2026-08-12) => mes en curso
 * = agosto; se consulta JULIO (mes pasado). Resolver real con repos mock; horario laborable todos los
 * dias (neto 480) para aislar la clasificacion del status del dia de la logica de fin de semana.
 */
@ExtendWith(MockitoExtension.class)
class ResumenMensualServiceTest {

    @Mock ResumenAsistenciaMensualRepository resumenRepository;
    @Mock AsistenciaRepository asistenciaRepository;
    @Mock AjusteJornadaRepository ajusteRepository;
    @Mock HorarioRepository horarioRepository;
    @Mock ExcepcionHorarioRepository excepcionRepository;
    @Mock DiaNoLaborableRepository diaNoLaborableRepository;
    @Mock ParametroAsistenciaResolver parametroResolver;

    private static final long EMP = 21L;
    private static final int ANIO = 2026;
    private static final int JULIO = 7;

    private Horario horario;
    private ResumenMensualService service;

    @BeforeEach
    void setUp() {
        Clock clock = Clock.fixed(
                ZonedDateTime.of(2026, 8, 12, 10, 0, 0, 0, OperationalDateTime.ZONE).toInstant(),
                OperationalDateTime.ZONE);
        OperationalDateTime.useClock(clock);

        horario = horarioTodosLosDias(LocalTime.of(8, 0), LocalTime.of(17, 0), LocalTime.of(13, 0), LocalTime.of(14, 0));
        lenient().when(horarioRepository.findHorarioVigente(eq(EMP), any())).thenReturn(Optional.of(horario));
        lenient().when(excepcionRepository.findByHorarioIdAndFecha(anyLong(), any())).thenReturn(Optional.empty());
        lenient().when(diaNoLaborableRepository.findByFecha(any())).thenReturn(List.of());
        lenient().when(ajusteRepository.findByIdEmpleadoAndFechaOperativaAndEstadoOrderByInicioAsc(anyLong(), any(), any()))
                .thenReturn(List.of());
        lenient().when(parametroResolver.resolve(any())).thenReturn(EffectiveParams.builder()
                .margenAdelantoMin(5).toleranciaTardanzaMin(5).bloqueoTardanzaMin(20)
                .maxMinutosPausaActiva(5).maxUsosPausaActivaDia(1).build());
        lenient().when(resumenRepository.saveAndFlush(any())).thenAnswer(i -> i.getArgument(0));

        JornadaEfectivaResolver resolver = new JornadaEfectivaResolver(
                horarioRepository, excepcionRepository, ajusteRepository, diaNoLaborableRepository, clock);
        service = new ResumenMensualService(resumenRepository, asistenciaRepository, ajusteRepository,
                horarioRepository, resolver, parametroResolver);
    }

    @AfterEach
    void tearDown() {
        OperationalDateTime.useClock(Clock.systemDefaultZone());
    }

    @Test
    void mesEnCursoNoTieneResumenFinal() {
        assertThatThrownBy(() -> service.obtener(EMP, 2026, 8))
                .isInstanceOf(BadRequestException.class);
    }

    @Test
    void mesFuturoNoTieneResumenFinal() {
        assertThatThrownBy(() -> service.obtener(EMP, 2026, 9))
                .isInstanceOf(BadRequestException.class);
    }

    @Test
    void mesConSnapshotDevuelveElSnapshotSinRecalcular() {
        ResumenAsistenciaMensual snapshot = ResumenAsistenciaMensual.builder()
                .idEmpleado(EMP).anio(ANIO).mes(JULIO)
                .diasLaborables(23).diasPresente(20).diasTardanza(2)
                .diasTardanzaCompensable(1).diasTardanzaJustificada(0).diasFalta(1)
                .minutosObjetivo(11040).minutosTrabajados(10800).balanceFinal(-240)
                .minutosExtra(60).minutosCompensados(0).cantidadTardanzas(2)
                .build();
        when(resumenRepository.findByIdEmpleadoAndAnioAndMes(EMP, ANIO, JULIO)).thenReturn(Optional.of(snapshot));

        ResumenMensualResponse r = service.obtener(EMP, ANIO, JULIO);

        assertThat(r.getBalanceFinal()).isEqualTo(-240);
        assertThat(r.getDiasFalta()).isEqualTo(1);
        // No debe recalcular: no toca asistencias ni persiste.
        verify(asistenciaRepository, never()).findByIdEmpleadoAndFechaBetweenOrderByFechaAsc(anyLong(), any(), any());
        verify(resumenRepository, never()).saveAndFlush(any());
    }

    @Test
    void mesSinSnapshotDerivaPersistYDevuelve() {
        when(resumenRepository.findByIdEmpleadoAndAnioAndMes(EMP, ANIO, JULIO)).thenReturn(Optional.empty());
        stubJulio();

        ResumenMensualResponse r = service.obtener(EMP, ANIO, JULIO);

        // Julio (todos laborables en este test) = 31 dias.
        assertThat(r.getDiasLaborables()).isEqualTo(31);
        assertThat(r.getDiasPresente()).isEqualTo(2);          // Jul 1, Jul 7
        assertThat(r.getDiasTardanza()).isEqualTo(3);          // cruda + compensada + justificada (umbrella)
        assertThat(r.getDiasTardanzaCompensable()).isEqualTo(1); // Jul 3
        assertThat(r.getDiasTardanzaJustificada()).isEqualTo(1);// Jul 6
        assertThat(r.getDiasFalta()).isEqualTo(26);            // 31 - 5 con marca
        assertThat(r.getMinutosObjetivo()).isEqualTo(31 * 480);
        assertThat(r.getMinutosTrabajados()).isEqualTo(2390);  // 480+470+480+480+480
        assertThat(r.getMinutosExtra()).isEqualTo(120);        // Jul 7
        assertThat(r.getBalanceFinal()).isEqualTo(-10);        // solo Jul 2 aporta deficit
        assertThat(r.getMinutosCompensados()).isZero();        // 3.4.b aun no wired
        assertThat(r.getCantidadTardanzas()).isEqualTo(3);
        verify(resumenRepository).saveAndFlush(any());
    }

    @Test
    void balanceFinalTopadoEnCeroNuncaPositivo() {
        when(resumenRepository.findByIdEmpleadoAndAnioAndMes(EMP, ANIO, JULIO)).thenReturn(Optional.empty());
        // Un solo dia trabajado, sin deficit (balance diario 0): el mes cierra en 0, no positivo.
        when(asistenciaRepository.findByIdEmpleadoAndFechaBetweenOrderByFechaAsc(eq(EMP), any(), any()))
                .thenReturn(List.of(asistencia(LocalDate.of(ANIO, JULIO, 1), LocalTime.of(8, 0), 480, 0, 0)));
        when(ajusteRepository.findByIdEmpleadoAndFechaOperativaBetweenAndEstado(eq(EMP), any(), any(), eq(EstadoAjusteJornada.ACTIVO)))
                .thenReturn(List.of());

        ResumenMensualResponse r = service.obtener(EMP, ANIO, JULIO);
        assertThat(r.getBalanceFinal()).isZero();
    }

    @Test
    void compensacionNeutralizaElDeficitDelMes() {
        when(resumenRepository.findByIdEmpleadoAndAnioAndMes(EMP, ANIO, JULIO)).thenReturn(Optional.empty());
        // Jul 1: dia corto (balance -30). Jul 4: tramo de compensacion trabajado 30.
        Asistencia corto = asistencia(LocalDate.of(ANIO, JULIO, 1), LocalTime.of(8, 0), 450, -30, 0);
        Asistencia comp = asistencia(LocalDate.of(ANIO, JULIO, 4), LocalTime.of(8, 0), 480, 0, 0);
        comp.setMinutosCompensados(30);
        when(asistenciaRepository.findByIdEmpleadoAndFechaBetweenOrderByFechaAsc(eq(EMP), any(), any()))
                .thenReturn(List.of(corto, comp));
        when(ajusteRepository.findByIdEmpleadoAndFechaOperativaBetweenAndEstado(eq(EMP), any(), any(), eq(EstadoAjusteJornada.ACTIVO)))
                .thenReturn(List.of());

        ResumenMensualResponse r = service.obtener(EMP, ANIO, JULIO);
        assertThat(r.getMinutosCompensados()).isEqualTo(30);
        assertThat(r.getBalanceFinal()).isZero(); // deficit -30 neutralizado
    }

    @Test
    void compensacionExcedenteSeTopaAlDeficitNoDaPositivo() {
        when(resumenRepository.findByIdEmpleadoAndAnioAndMes(EMP, ANIO, JULIO)).thenReturn(Optional.empty());
        Asistencia corto = asistencia(LocalDate.of(ANIO, JULIO, 1), LocalTime.of(8, 0), 450, -30, 0);
        Asistencia comp = asistencia(LocalDate.of(ANIO, JULIO, 4), LocalTime.of(8, 0), 480, 0, 0);
        comp.setMinutosCompensados(50); // trabajo 50 pero solo debia 30
        when(asistenciaRepository.findByIdEmpleadoAndFechaBetweenOrderByFechaAsc(eq(EMP), any(), any()))
                .thenReturn(List.of(corto, comp));
        when(ajusteRepository.findByIdEmpleadoAndFechaOperativaBetweenAndEstado(eq(EMP), any(), any(), eq(EstadoAjusteJornada.ACTIVO)))
                .thenReturn(List.of());

        ResumenMensualResponse r = service.obtener(EMP, ANIO, JULIO);
        assertThat(r.getMinutosCompensados()).isEqualTo(30); // topado al deficit; el exceso se ignora
        assertThat(r.getBalanceFinal()).isZero();
    }

    @Test
    void recalcularBorraElSnapshotYRecomputa() {
        stubJulio();

        ResumenMensualResponse r = service.recalcular(EMP, ANIO, JULIO);

        verify(resumenRepository).deleteByIdEmpleadoAndAnioAndMes(EMP, ANIO, JULIO);
        verify(resumenRepository).saveAndFlush(any());
        assertThat(r.getDiasLaborables()).isEqualTo(31);
    }

    @Test
    void diaConExtraContiguoAncladaAlBaseEsPresenteYSumaExtra() {
        // Asistencia de un dia con extra-antes contiguo ya resuelta por el motor: anclada al base (entrada
        // 13:00), marca 12:22, 24 min a minutosExtra, balance 0. El resumen debe leerla como PRESENTE (la
        // tardanza se mide contra el base 13:00) y sumar el extra al mensual sin tocar el balance.
        when(resumenRepository.findByIdEmpleadoAndAnioAndMes(EMP, ANIO, JULIO)).thenReturn(Optional.empty());
        LocalDate fecha = LocalDate.of(ANIO, JULIO, 1);
        Asistencia a = Asistencia.builder()
                .id(1L).idEmpleado(EMP).idHorario(7L).fecha(fecha)
                .estadoActual(EstadoAsistencia.OFFLINE)
                .entradaProgramada(LocalTime.of(13, 0)).salidaProgramada(LocalTime.of(18, 0))
                .fechaHoraIngreso(LocalDateTime.of(fecha, LocalTime.of(12, 22)))
                .fechaHoraSalida(LocalDateTime.of(fecha, LocalTime.of(18, 5)))
                .minutosObjetivoDia(300).minutosTrabajados(300).minutosBalance(0).minutosExtra(24)
                .build();
        when(asistenciaRepository.findByIdEmpleadoAndFechaBetweenOrderByFechaAsc(eq(EMP), any(), any()))
                .thenReturn(List.of(a));
        when(ajusteRepository.findByIdEmpleadoAndFechaOperativaBetweenAndEstado(eq(EMP), any(), any(), eq(EstadoAjusteJornada.ACTIVO)))
                .thenReturn(List.of());

        ResumenMensualResponse r = service.obtener(EMP, ANIO, JULIO);

        assertThat(r.getDiasPresente()).isEqualTo(1);   // 12:22 vs base 13:00 -> no tardanza
        assertThat(r.getDiasTardanza()).isZero();
        assertThat(r.getMinutosExtra()).isEqualTo(24);  // el extra suma al mensual
        assertThat(r.getBalanceFinal()).isZero();       // el extra no toca el balance
    }

    // ===================== helpers =====================

    /** Escenario de julio: 5 dias con marca (presente/tardanza/compensada/justificada/extra), resto falta. */
    private void stubJulio() {
        List<Asistencia> asistencias = new ArrayList<>();
        asistencias.add(asistencia(LocalDate.of(ANIO, JULIO, 1), LocalTime.of(8, 0), 480, 0, 0));   // presente
        asistencias.add(asistencia(LocalDate.of(ANIO, JULIO, 2), LocalTime.of(8, 10), 470, -10, 0)); // tardanza cruda
        Asistencia compensada = asistencia(LocalDate.of(ANIO, JULIO, 3), LocalTime.of(8, 30), 480, 0, 0);
        compensada.setEntradaProgramada(LocalTime.of(8, 30)); // corrida: puntual vs el horario desplazado
        asistencias.add(compensada);
        asistencias.add(asistencia(LocalDate.of(ANIO, JULIO, 6), LocalTime.of(8, 0), 480, 0, 0));   // justificada (por ajuste)
        asistencias.add(asistencia(LocalDate.of(ANIO, JULIO, 7), LocalTime.of(8, 0), 480, 0, 120)); // presente + extra
        when(asistenciaRepository.findByIdEmpleadoAndFechaBetweenOrderByFechaAsc(eq(EMP), any(), any()))
                .thenReturn(asistencias);

        when(ajusteRepository.findByIdEmpleadoAndFechaOperativaBetweenAndEstado(eq(EMP), any(), any(), eq(EstadoAjusteJornada.ACTIVO)))
                .thenReturn(List.of(
                        ajuste(LocalDate.of(ANIO, JULIO, 3), RazonAjuste.CORRIMIENTO_COMPENSABLE),
                        ajuste(LocalDate.of(ANIO, JULIO, 6), RazonAjuste.CORRIMIENTO_JUSTIFICADA)));
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

    private Asistencia asistencia(LocalDate fecha, LocalTime ingreso, int trabajados, int balance, int extra) {
        return Asistencia.builder()
                .id(fecha.getDayOfMonth() + 100L).idEmpleado(EMP).idHorario(7L).fecha(fecha)
                .estadoActual(EstadoAsistencia.OFFLINE)
                .entradaProgramada(LocalTime.of(8, 0)).salidaProgramada(LocalTime.of(17, 0))
                .fechaHoraIngreso(LocalDateTime.of(fecha, ingreso))
                .fechaHoraSalida(LocalDateTime.of(fecha, LocalTime.of(17, 0)))
                .minutosObjetivoDia(480).minutosTrabajados(trabajados).minutosBalance(balance).minutosExtra(extra)
                .build();
    }

    private AjusteJornada ajuste(LocalDate fecha, RazonAjuste razon) {
        return AjusteJornada.builder()
                .id(fecha.getDayOfMonth() + 500L).idEmpleado(EMP).horario(horario)
                .fechaOperativa(fecha).inicio(LocalDateTime.of(fecha, LocalTime.of(8, 30)))
                .fin(LocalDateTime.of(fecha, LocalTime.of(17, 30)))
                .estado(EstadoAjusteJornada.ACTIVO).razon(razon).creadoPor(99L).motivo("test")
                .build();
    }
}
