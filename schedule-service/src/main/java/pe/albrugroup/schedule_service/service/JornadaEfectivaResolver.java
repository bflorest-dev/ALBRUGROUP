package pe.albrugroup.schedule_service.service;

import lombok.Builder;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.albrugroup.schedule_service.entity.AjusteJornada;
import pe.albrugroup.schedule_service.entity.DiaNoLaborable;
import pe.albrugroup.schedule_service.entity.ExcepcionHorario;
import pe.albrugroup.schedule_service.entity.Horario;
import pe.albrugroup.schedule_service.entity.HorarioDetalle;
import pe.albrugroup.schedule_service.entity.enums.AlcanceDiaNoLaborable;
import pe.albrugroup.schedule_service.entity.enums.Dia;
import pe.albrugroup.schedule_service.entity.enums.EstadoAjusteJornada;
import pe.albrugroup.schedule_service.entity.enums.OrigenAjusteJornada;
import pe.albrugroup.schedule_service.entity.enums.TipoDiaNoLaborable;
import pe.albrugroup.schedule_service.entity.enums.TipoExcepcionHorario;
import pe.albrugroup.schedule_service.entity.response.horario.JornadaEfectivaResponse;
import pe.albrugroup.schedule_service.entity.response.horario.TramoJornadaResponse;
import pe.albrugroup.schedule_service.exception.NotFoundException;
import pe.albrugroup.schedule_service.repository.AjusteJornadaRepository;
import pe.albrugroup.schedule_service.repository.DiaNoLaborableRepository;
import pe.albrugroup.schedule_service.repository.ExcepcionHorarioRepository;
import pe.albrugroup.schedule_service.repository.HorarioRepository;

import java.time.*;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class JornadaEfectivaResolver {

    private final HorarioRepository horarioRepository;
    private final ExcepcionHorarioRepository excepcionHorarioRepository;
    private final AjusteJornadaRepository ajusteJornadaRepository;
    private final DiaNoLaborableRepository diaNoLaborableRepository;
    private final Clock operationalClock;

    @Transactional(readOnly = true)
    public JornadaEfectivaResponse resolver(Long idEmpleado, LocalDate fecha) {
        Horario horario = horarioRepository.findHorarioVigente(idEmpleado, fecha)
                .orElseThrow(() -> new NotFoundException("Horario vigente no encontrado", idEmpleado));
        List<AjusteJornada> ajustes = ajusteJornadaRepository
                .findByIdEmpleadoAndFechaOperativaAndEstadoOrderByInicioAsc(
                        idEmpleado, fecha, EstadoAjusteJornada.ACTIVO);
        return resolver(horario, fecha, ajustes);
    }

    @Transactional(readOnly = true)
    public Optional<JornadaEfectivaResponse> resolverSiExiste(Long idEmpleado, LocalDate fecha) {
        Optional<Horario> horario = horarioRepository.findHorarioVigente(idEmpleado, fecha);
        if (horario.isEmpty()) {
            return Optional.empty();
        }

        List<AjusteJornada> ajustes = ajusteJornadaRepository
                .findByIdEmpleadoAndFechaOperativaAndEstadoOrderByInicioAsc(
                        idEmpleado, fecha, EstadoAjusteJornada.ACTIVO);
        try {
            return Optional.of(resolver(horario.get(), fecha, ajustes));
        } catch (NotFoundException e) {
            return Optional.empty();
        }
    }

    JornadaEfectivaResponse resolver(Horario horario, LocalDate fecha, List<AjusteJornada> ajustes) {
        DiaNoLaborable diaNoLaborable = resolverDiaNoLaborable(horario.getIdEmpleado(), fecha);
        ExcepcionHorario excepcion = excepcionHorarioRepository
                .findByHorarioIdAndFecha(horario.getId(), fecha).orElse(null);
        return resolver(horario, fecha, ajustes, diaNoLaborable, excepcion);
    }

    JornadaEfectivaResponse resolver(
            Horario horario,
            LocalDate fecha,
            List<AjusteJornada> ajustes,
            DiaNoLaborable diaNoLaborable,
            ExcepcionHorario excepcion
    ) {
        BaseDiaria base = resolverBase(horario, fecha, diaNoLaborable, excepcion);
        List<TramoJornadaResponse> tramos = new ArrayList<>();
        TramoJornadaResponse tramoBase = base.laborable()
                ? toBaseTramo(fecha, base)
                : null;

        // Solo un CORRIMIENTO (REEMPLAZO_BASE) reemplaza el base. Un ajuste aditivo (extra/compensacion) es
        // disjunto por invariante (validado al registrar); si por data mala se solapara, NO debe descartar
        // el base (eso escondia el turno base).
        boolean baseReemplazada = tramoBase != null && ajustes.stream()
                .filter(ajuste -> ajuste.getOrigen() == OrigenAjusteJornada.REEMPLAZO_BASE)
                .anyMatch(ajuste -> overlaps(
                        ajuste.getInicio(), ajuste.getFin(), tramoBase.getInicio(), tramoBase.getFin()));
        if (tramoBase != null && !baseReemplazada) {
            tramos.add(tramoBase);
        }
        ajustes.stream()
                .map(ajuste -> toTramo(ajuste, reemplazaBaseEfectiva(ajuste, tramoBase)))
                .forEach(tramos::add);
        tramos.sort(Comparator.comparing(TramoJornadaResponse::getInicio));

        LocalDateTime ahora = LocalDateTime.now(operationalClock);
        TramoJornadaResponse actual = fecha.equals(ahora.toLocalDate())
                ? tramos.stream()
                .filter(tramo -> !ahora.isBefore(tramo.getInicio()) && ahora.isBefore(tramo.getFin()))
                .findFirst().orElse(null)
                : null;
        TramoJornadaResponse proximo = tramos.stream()
                .filter(tramo -> tramo.getInicio().isAfter(ahora))
                .findFirst().orElse(null);

        return JornadaEfectivaResponse.builder()
                .idEmpleado(horario.getIdEmpleado())
                .idHorario(horario.getId())
                .fecha(fecha)
                .laborableBase(base.laborable())
                .tramos(tramos)
                .tramoActual(actual)
                .proximoTramo(proximo)
                .build();
    }

    BaseDiaria resolverBase(Horario horario, LocalDate fecha) {
        DiaNoLaborable diaNoLaborable = resolverDiaNoLaborable(horario.getIdEmpleado(), fecha);
        ExcepcionHorario excepcion = excepcionHorarioRepository
                .findByHorarioIdAndFecha(horario.getId(), fecha).orElse(null);
        return resolverBase(horario, fecha, diaNoLaborable, excepcion);
    }

    BaseDiaria resolverBase(
            Horario horario,
            LocalDate fecha,
            DiaNoLaborable diaNoLaborable,
            ExcepcionHorario excepcion
    ) {
        // Dia no laborable (feriado / vacaciones / permiso), precedencia EMPLEADO > GLOBAL. laborable=false
        // => dia libre; laborable=true => override "si trabaja" (continua la resolucion normal).
        if (diaNoLaborable != null && !Boolean.TRUE.equals(diaNoLaborable.getLaborable())) {
            return new BaseDiaria(false, null, null);
        }

        if (excepcion != null) {
            if (excepcion.getTipo() == TipoExcepcionHorario.DIA_LIBRE
                    || Boolean.FALSE.equals(excepcion.getLaborable())) {
                return new BaseDiaria(false, null, null);
            }
            if (excepcion.getHoraEntrada() != null && excepcion.getHoraSalida() != null) {
                return new BaseDiaria(
                        true,
                        LocalDateTime.of(fecha, excepcion.getHoraEntrada()),
                        LocalDateTime.of(fecha, excepcion.getHoraSalida())
                );
            }
        }

        Dia dia = mapearDia(fecha.getDayOfWeek());
        HorarioDetalle detalle = horario.getDetalles().stream()
                .filter(item -> item.getDia() == dia)
                .findFirst()
                .orElseThrow(() -> new NotFoundException("No existe detalle de horario para el dia", dia));
        if (!Boolean.TRUE.equals(detalle.getLaborable())) {
            return new BaseDiaria(false, null, null);
        }
        return new BaseDiaria(
                true,
                LocalDateTime.of(fecha, detalle.getHoraEntrada()),
                LocalDateTime.of(fecha, detalle.getHoraSalida())
        );
    }

    private TramoJornadaResponse toBaseTramo(LocalDate fecha, BaseDiaria base) {
        return TramoJornadaResponse.builder()
                .inicio(base.inicio())
                .fin(base.fin())
                .base(true)
                .motivo("Horario base")
                .build();
    }

    private boolean reemplazaBaseEfectiva(AjusteJornada ajuste, TramoJornadaResponse tramoBase) {
        return tramoBase != null
                && ajuste.getOrigen() == OrigenAjusteJornada.REEMPLAZO_BASE
                && overlaps(ajuste.getInicio(), ajuste.getFin(), tramoBase.getInicio(), tramoBase.getFin());
    }

    private TramoJornadaResponse toTramo(AjusteJornada ajuste, boolean baseEfectiva) {
        return TramoJornadaResponse.builder()
                .idAjuste(ajuste.getId())
                .inicio(ajuste.getInicio())
                .fin(ajuste.getFin())
                .origen(ajuste.getOrigen())
                .base(baseEfectiva)
                .motivo(ajuste.getMotivo())
                .build();
    }

    static boolean overlaps(LocalDateTime leftStart, LocalDateTime leftEnd,
                            LocalDateTime rightStart, LocalDateTime rightEnd) {
        return leftStart.isBefore(rightEnd) && rightStart.isBefore(leftEnd);
    }

    /**
     * Tipo del dia no laborable aplicable a (empleado, fecha) cuando marca el dia como LIBRE
     * (laborable=false). Null si no hay declaracion, o si la declaracion es un override "si trabaja".
     * Sirve para que la vista de asistencia muestre "Feriado/Vacaciones/Descanso medico/Permiso".
     */
    public TipoDiaNoLaborable tipoDiaLibre(Long idEmpleado, LocalDate fecha) {
        DiaNoLaborable dia = resolverDiaNoLaborable(idEmpleado, fecha);
        if (dia == null || Boolean.TRUE.equals(dia.getLaborable())) {
            return null;
        }
        return dia.getTipo();
    }

    /** Override de calendario aplicable a (empleado, fecha): el mas angosto gana (EMPLEADO > GLOBAL). */
    private DiaNoLaborable resolverDiaNoLaborable(Long idEmpleado, LocalDate fecha) {
        List<DiaNoLaborable> dias = diaNoLaborableRepository.findByFecha(fecha);
        if (dias.isEmpty()) {
            return null;
        }
        return dias.stream()
                .filter(d -> d.getAlcance() == AlcanceDiaNoLaborable.EMPLEADO && idEmpleado.equals(d.getRefId()))
                .findFirst()
                .orElseGet(() -> dias.stream()
                        .filter(d -> d.getAlcance() == AlcanceDiaNoLaborable.GLOBAL)
                        .findFirst()
                        .orElse(null));
    }

    static Dia mapearDia(DayOfWeek dayOfWeek) {
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

    /**
     * Objetivo contractual del dia: usa el detalle recurrente del horario base, no una excepcion
     * puntual de entrada/salida. La excepcion solo decide si el dia conserva o pierde su objetivo
     * mediante {@code laborableBase}.
     */
    int minutosObjetivoContractual(Long idEmpleado, LocalDate fecha) {
        Horario horario = horarioRepository.findHorarioVigente(idEmpleado, fecha).orElse(null);
        if (horario == null) {
            return 0;
        }
        JornadaEfectivaResponse jornada = resolverSiExiste(idEmpleado, fecha).orElse(null);
        if (jornada == null || !Boolean.TRUE.equals(jornada.getLaborableBase())) {
            return 0;
        }
        return minutosObjetivoContractual(horario, fecha);
    }

    /**
     * PROGRAMADO base del dia (concepto 2): horas asignadas en el HORARIO de ese dia (salida-entrada-almuerzo),
     * independiente de corrimientos/cambios puntuales. NO es el objetivo contractual: ese sale de la modalidad
     * (ver {@link #minutosObjetivoModalidad}). Nombre historico conservado por sus callers del flujo de marcacion.
     */
    int minutosObjetivoContractual(Horario horario, LocalDate fecha) {
        Dia dia = mapearDia(fecha.getDayOfWeek());
        return horario.getDetalles().stream()
                .filter(detalle -> detalle.getDia() == dia)
                .filter(detalle -> Boolean.TRUE.equals(detalle.getLaborable()))
                .findFirst()
                .map(this::minutosObjetivoDetalle)
                .orElse(0);
    }

    /**
     * HORAS OBJETIVO del dia (concepto 1): horas operativas de la MODALIDAD del contrato, INDEPENDIENTES del
     * horario. Suma salvo que el dia este LIBERADO: descanso principal del horario, feriado, vacaciones o
     * descanso medico. PERMISO (= falta justificada) NO libera: sus horas siguen esperandose. Los descansos
     * SECUNDARIOS tampoco liberan (cuentan al objetivo). Fuente: reworks/CasoDeUsoHorariosPlanilla.txt.
     */
    int minutosObjetivoModalidad(Long idEmpleado, LocalDate fecha) {
        Horario horario = horarioRepository.findHorarioVigente(idEmpleado, fecha).orElse(null);
        if (horario == null) {
            return 0;
        }
        TipoDiaNoLaborable evento = tipoDiaLibre(idEmpleado, fecha);
        if (evento != null && evento != TipoDiaNoLaborable.PERMISO) {
            return 0; // feriado, vacaciones, descanso medico -> liberan el objetivo
        }
        return minutosObjetivoModalidad(horario, fecha);
    }

    /** Objetivo por modalidad considerando solo el descanso PRINCIPAL del horario (sin eventos de calendario). */
    int minutosObjetivoModalidad(Horario horario, LocalDate fecha) {
        Dia dia = mapearDia(fecha.getDayOfWeek());
        boolean esDescansoPrincipal = horario.getDetalles().stream()
                .anyMatch(d -> d.getDia() == dia
                        && Boolean.FALSE.equals(d.getLaborable())
                        && Boolean.TRUE.equals(d.getDescansoPrincipal()));
        if (esDescansoPrincipal) {
            return 0;
        }
        Integer min = horario.getPoliticaModalidad() != null
                ? horario.getPoliticaModalidad().getMinutosOperativosDia() : null;
        return min != null ? min : 0;
    }

    private int minutosObjetivoDetalle(HorarioDetalle detalle) {
        if (detalle.getHoraEntrada() == null || detalle.getHoraSalida() == null) {
            return 0;
        }
        LocalDate referencia = LocalDate.of(2000, 1, 1);
        LocalDateTime inicio = referencia.atTime(detalle.getHoraEntrada());
        LocalDateTime fin = referencia.atTime(detalle.getHoraSalida());
        if (!fin.isAfter(inicio)) {
            fin = fin.plusDays(1);
        }

        int minutosBase = (int) Duration.between(inicio, fin).toMinutes();
        if (detalle.getInicioAlmuerzo() == null || detalle.getFinAlmuerzo() == null) {
            return Math.max(minutosBase, 0);
        }

        LocalDateTime inicioAlmuerzo = referencia.atTime(detalle.getInicioAlmuerzo());
        LocalDateTime finAlmuerzo = referencia.atTime(detalle.getFinAlmuerzo());
        if (!finAlmuerzo.isAfter(inicioAlmuerzo)) {
            finAlmuerzo = finAlmuerzo.plusDays(1);
        }

        LocalDateTime inicioSolape = inicio.isAfter(inicioAlmuerzo) ? inicio : inicioAlmuerzo;
        LocalDateTime finSolape = fin.isBefore(finAlmuerzo) ? fin : finAlmuerzo;
        int minutosAlmuerzo = finSolape.isAfter(inicioSolape)
                ? (int) Duration.between(inicioSolape, finSolape).toMinutes()
                : 0;
        return Math.max(minutosBase - minutosAlmuerzo, 0);
    }

    @Builder
    record BaseDiaria(boolean laborable, LocalDateTime inicio, LocalDateTime fin) {
    }
}
