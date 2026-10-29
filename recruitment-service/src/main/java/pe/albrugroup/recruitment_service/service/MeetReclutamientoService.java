package pe.albrugroup.recruitment_service.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.albrugroup.recruitment_service.entity.HorarioMeetReclutamiento;
import pe.albrugroup.recruitment_service.entity.SesionMeetReclutamiento;
import pe.albrugroup.recruitment_service.entity.enums.Negocio;
import pe.albrugroup.recruitment_service.entity.response.HorarioMeetResponse;
import pe.albrugroup.recruitment_service.entity.response.PostulacionResponse;
import pe.albrugroup.recruitment_service.entity.response.SesionMeetResponse;
import pe.albrugroup.recruitment_service.exception.BadRequestException;
import pe.albrugroup.recruitment_service.exception.NotFoundException;
import pe.albrugroup.recruitment_service.repository.ActividadReclutamientoRepository;
import pe.albrugroup.recruitment_service.repository.HorarioMeetReclutamientoRepository;
import pe.albrugroup.recruitment_service.repository.PostulacionRepository;
import pe.albrugroup.recruitment_service.repository.SesionMeetReclutamientoRepository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class MeetReclutamientoService {

    private static final ZoneId LIMA = ZoneId.of("America/Lima");

    private final HorarioMeetReclutamientoRepository horarios;
    private final SesionMeetReclutamientoRepository sesiones;
    private final ActividadReclutamientoRepository actividades;
    private final PostulacionRepository postulaciones;
    private final PostulacionService postulacionService;

    public List<HorarioMeetResponse> listarHorarios(Negocio negocio) {
        if (negocio == null) {
            throw new BadRequestException("El negocio es obligatorio para consultar horarios de Meet.");
        }
        return horarios.findByNegocioAndActivoTrueOrderByHoraInicioAsc(negocio).stream()
                .map(this::toHorarioResponse)
                .toList();
    }

    public List<SesionMeetResponse> listarSesiones(LocalDate fecha, Negocio negocio) {
        LocalDate fechaConsulta = fecha == null ? LocalDate.now(LIMA) : fecha;
        List<SesionMeetReclutamiento> resultado = negocio == null
                ? sesiones.findByFechaOrderByFechaHoraInicioAsc(fechaConsulta)
                : sesiones.findByFechaAndNegocioOrderByFechaHoraInicioAsc(fechaConsulta, negocio);
        return resultado.stream().map(this::toSesionResponse).toList();
    }

    public SesionMeetResponse obtenerSesion(Long id) {
        SesionMeetReclutamiento sesion = sesiones.findById(id)
                .orElseThrow(() -> new NotFoundException(SesionMeetReclutamiento.class, id));
        return toSesionResponse(sesion);
    }

    public HorarioMeetReclutamiento obtenerHorario(Long id) {
        return horarios.findById(id)
                .orElseThrow(() -> new NotFoundException(HorarioMeetReclutamiento.class, id));
    }

    @Transactional
    public SesionMeetReclutamiento obtenerOCrearSesion(Long idHorario, LocalDate fecha, Negocio negocio) {
        if (fecha == null || !fecha.isAfter(LocalDate.now(LIMA).minusDays(1))) {
            throw new BadRequestException("El Meet debe programarse para hoy o una fecha futura.");
        }
        HorarioMeetReclutamiento horario = obtenerHorario(idHorario);
        if (!Boolean.TRUE.equals(horario.getActivo()) || horario.getNegocio() != negocio) {
            throw new BadRequestException("El horario seleccionado no está disponible para este negocio.");
        }

        return sesiones.findLockedByHorarioIdAndFecha(idHorario, fecha).orElseGet(() -> {
            SesionMeetReclutamiento sesion = new SesionMeetReclutamiento();
            sesion.setHorario(horario);
            sesion.setNegocio(negocio);
            sesion.setFecha(fecha);
            LocalTime hora = horario.getHoraInicio();
            sesion.setFechaHoraInicio(LocalDateTime.of(fecha, hora));
            sesion.setEstado("PROGRAMADA");
            return sesiones.saveAndFlush(sesion);
        });
    }

    private HorarioMeetResponse toHorarioResponse(HorarioMeetReclutamiento horario) {
        return new HorarioMeetResponse(
                horario.getId(), horario.getNegocio(), horario.getCodigo(),
                horario.getEtiqueta(), horario.getHoraInicio()
        );
    }

    private SesionMeetResponse toSesionResponse(SesionMeetReclutamiento sesion) {
        List<PostulacionResponse> postulacionesSesion = actividades
                .findByMeetSesionIdOrderByFechaHoraAscIdAsc(sesion.getId())
                .stream()
                .map(actividad -> postulacionService.obtenerPostulacion(actividad.getPostulacionId()))
                .toList();
        return new SesionMeetResponse(
                sesion.getId(),
                sesion.getNegocio(),
                sesion.getFecha(),
                sesion.getFechaHoraInicio(),
                sesion.getHorario() == null ? null : sesion.getHorario().getId(),
                sesion.getHorario() == null ? "Sesión histórica" : sesion.getHorario().getEtiqueta(),
                sesion.getEnlace(),
                sesion.getEstado(),
                postulacionesSesion
        );
    }
}
