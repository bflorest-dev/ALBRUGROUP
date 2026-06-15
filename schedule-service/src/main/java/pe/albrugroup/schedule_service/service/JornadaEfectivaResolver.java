package pe.albrugroup.schedule_service.service;

import lombok.Builder;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.albrugroup.schedule_service.entity.AjusteJornada;
import pe.albrugroup.schedule_service.entity.ExcepcionHorario;
import pe.albrugroup.schedule_service.entity.Horario;
import pe.albrugroup.schedule_service.entity.HorarioDetalle;
import pe.albrugroup.schedule_service.entity.enums.Dia;
import pe.albrugroup.schedule_service.entity.enums.EstadoAjusteJornada;
import pe.albrugroup.schedule_service.entity.enums.OrigenAjusteJornada;
import pe.albrugroup.schedule_service.entity.enums.TipoExcepcionHorario;
import pe.albrugroup.schedule_service.entity.response.horario.JornadaEfectivaResponse;
import pe.albrugroup.schedule_service.entity.response.horario.TramoJornadaResponse;
import pe.albrugroup.schedule_service.exception.NotFoundException;
import pe.albrugroup.schedule_service.repository.AjusteJornadaRepository;
import pe.albrugroup.schedule_service.repository.ExcepcionHorarioRepository;
import pe.albrugroup.schedule_service.repository.HorarioRepository;

import java.time.*;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
public class JornadaEfectivaResolver {

    private final HorarioRepository horarioRepository;
    private final ExcepcionHorarioRepository excepcionHorarioRepository;
    private final AjusteJornadaRepository ajusteJornadaRepository;
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

    JornadaEfectivaResponse resolver(Horario horario, LocalDate fecha, List<AjusteJornada> ajustes) {
        BaseDiaria base = resolverBase(horario, fecha);
        List<TramoJornadaResponse> tramos = new ArrayList<>();
        TramoJornadaResponse tramoBase = base.laborable()
                ? toBaseTramo(fecha, base)
                : null;

        boolean baseReemplazada = tramoBase != null && ajustes.stream()
                .anyMatch(ajuste -> overlaps(
                        ajuste.getInicio(), ajuste.getFin(), tramoBase.getInicio(), tramoBase.getFin()));
        if (tramoBase != null && !baseReemplazada) {
            tramos.add(tramoBase);
        }
        ajustes.stream().map(this::toTramo).forEach(tramos::add);
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
        ExcepcionHorario excepcion = excepcionHorarioRepository
                .findByHorarioIdAndFecha(horario.getId(), fecha).orElse(null);
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

    private TramoJornadaResponse toTramo(AjusteJornada ajuste) {
        return TramoJornadaResponse.builder()
                .idAjuste(ajuste.getId())
                .inicio(ajuste.getInicio())
                .fin(ajuste.getFin())
                .origen(ajuste.getOrigen())
                .base(false)
                .motivo(ajuste.getMotivo())
                .build();
    }

    static boolean overlaps(LocalDateTime leftStart, LocalDateTime leftEnd,
                            LocalDateTime rightStart, LocalDateTime rightEnd) {
        return leftStart.isBefore(rightEnd) && rightStart.isBefore(leftEnd);
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

    @Builder
    record BaseDiaria(boolean laborable, LocalDateTime inicio, LocalDateTime fin) {
    }
}
