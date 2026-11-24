package pe.albrugroup.recruitment_service.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.albrugroup.recruitment_service.entity.HorarioMeetReclutamiento;
import pe.albrugroup.recruitment_service.entity.GestionReclutamiento;
import pe.albrugroup.recruitment_service.entity.SesionMeetReclutamiento;
import pe.albrugroup.recruitment_service.entity.enums.Negocio;
import pe.albrugroup.recruitment_service.entity.response.HorarioMeetResponse;
import pe.albrugroup.recruitment_service.entity.response.PostulacionResponse;
import pe.albrugroup.recruitment_service.entity.response.SesionMeetResponse;
import pe.albrugroup.recruitment_service.entity.response.SesionMeetParticipanteResponse;
import pe.albrugroup.recruitment_service.exception.BadRequestException;
import pe.albrugroup.recruitment_service.exception.NotFoundException;
import pe.albrugroup.recruitment_service.repository.ActividadReclutamientoRepository;
import pe.albrugroup.recruitment_service.repository.GestionReclutamientoRepository;
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
    private final GestionReclutamientoRepository gestiones;
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
        return listarSesiones(fechaConsulta, fechaConsulta, negocio, null);
    }

    public List<SesionMeetResponse> listarSesiones(
            LocalDate desde,
            LocalDate hasta,
            Negocio negocio,
            String estado
    ) {
        if (negocio == null) {
            throw new BadRequestException("El negocio es obligatorio para consultar la agenda Meet.");
        }
        LocalDate desdeConsulta = desde == null ? LocalDate.now(LIMA) : desde;
        LocalDate hastaConsulta = hasta == null ? desdeConsulta : hasta;
        if (hastaConsulta.isBefore(desdeConsulta)) {
            throw new BadRequestException("El rango de fechas de la agenda Meet no es válido.");
        }
        List<SesionMeetReclutamiento> resultado = estado == null || estado.isBlank()
                ? sesiones.findByFechaBetweenAndNegocioOrderByFechaHoraInicioAsc(desdeConsulta, hastaConsulta, negocio)
                : sesiones.findByFechaBetweenAndNegocioAndEstadoOrderByFechaHoraInicioAsc(
                        desdeConsulta, hastaConsulta, negocio, estado.trim().toUpperCase()
                );
        return resultado.stream().map(this::toSesionResponse).toList();
    }

    public SesionMeetResponse obtenerSesion(Long id, Negocio negocio) {
        return toSesionResponse(obtenerSesionEntidad(id, negocio));
    }

    public SesionMeetReclutamiento obtenerSesionEntidad(Long id, Negocio negocio) {
        SesionMeetReclutamiento sesion = sesiones.findById(id)
                .orElseThrow(() -> new NotFoundException(SesionMeetReclutamiento.class, id));
        if (negocio == null || sesion.getNegocio() != negocio) {
            throw new BadRequestException("La sesión Meet no pertenece al negocio activo.");
        }
        return sesion;
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
        List<pe.albrugroup.recruitment_service.entity.ActividadReclutamiento> actividadesSesion =
                actividades.findLatestByMeetSesionIdOrderByFechaHoraAscIdAsc(sesion.getId());
        List<PostulacionResponse> postulacionesSesion = actividadesSesion.stream()
                .map(actividad -> postulacionService.obtenerPostulacion(actividad.getPostulacionId()))
                .toList();
        List<SesionMeetParticipanteResponse> participantes = actividadesSesion.stream().map(actividad -> {
            var postulacion = postulacionService.obtenerPostulacion(actividad.getPostulacionId());
            GestionReclutamiento gestion = gestiones.findById(actividad.getPostulacionId()).orElse(null);
            return new SesionMeetParticipanteResponse(
                    actividad.getPostulacionId(),
                    postulacion,
                    asistencia(actividad.getEstado()),
                    gestion == null ? null : gestion.getResultadoEvaluacion(),
                    gestion == null ? null : gestion.getEvaluadaAt(),
                    actividad.getResponsableId(),
                    gestion == null ? 0L : gestion.getRevision()
            );
        }).toList();
        return new SesionMeetResponse(
                sesion.getId(),
                sesion.getNegocio(),
                sesion.getFecha(),
                sesion.getFechaHoraInicio(),
                sesion.getHorario() == null ? null : sesion.getHorario().getId(),
                sesion.getHorario() == null ? "Sesión histórica" : sesion.getHorario().getEtiqueta(),
                sesion.getEnlace(),
                sesion.getEstado(),
                postulacionesSesion,
                participantes
        );
    }

    private String asistencia(String estado) {
        return switch (estado) {
            case "REALIZADA" -> "ASISTIO";
            case "INASISTENCIA" -> "NO_ASISTIO";
            default -> "PENDIENTE";
        };
    }
}
