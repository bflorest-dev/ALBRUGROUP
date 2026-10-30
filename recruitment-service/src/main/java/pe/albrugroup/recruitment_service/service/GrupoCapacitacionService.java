package pe.albrugroup.recruitment_service.service;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.albrugroup.recruitment_service.entity.GrupoCapacitacion;
import pe.albrugroup.recruitment_service.entity.GrupoCapacitacionDetalle;
import pe.albrugroup.recruitment_service.entity.Postulacion;
import pe.albrugroup.recruitment_service.entity.enums.Accion;
import pe.albrugroup.recruitment_service.entity.enums.EstadoBandejaPostulacion;
import pe.albrugroup.recruitment_service.entity.enums.EstadoCapacitacionPostulante;
import pe.albrugroup.recruitment_service.entity.enums.EstadoGrupoCapacitacion;
import pe.albrugroup.recruitment_service.entity.enums.EstadoPostulacion;
import pe.albrugroup.recruitment_service.entity.enums.Etapa;
import pe.albrugroup.recruitment_service.entity.enums.PuestoObjetivo;
import pe.albrugroup.recruitment_service.entity.request.ActualizarDetalleGrupoCapacitacionRequest;
import pe.albrugroup.recruitment_service.entity.request.AgregarPostulacionGrupoCapacitacionRequest;
import pe.albrugroup.recruitment_service.entity.request.GrupoCapacitacionRequest;
import pe.albrugroup.recruitment_service.entity.request.PageRequest;
import pe.albrugroup.recruitment_service.entity.response.GrupoCapacitacionDetalleResponse;
import pe.albrugroup.recruitment_service.entity.response.GrupoCapacitacionResponse;
import pe.albrugroup.recruitment_service.entity.response.PageResponse;
import pe.albrugroup.recruitment_service.exception.BadRequestException;
import pe.albrugroup.recruitment_service.exception.ConflictException;
import pe.albrugroup.recruitment_service.exception.NotFoundException;
import pe.albrugroup.recruitment_service.repository.GrupoCapacitacionDetalleRepository;
import pe.albrugroup.recruitment_service.repository.GrupoCapacitacionRepository;
import pe.albrugroup.recruitment_service.repository.GestionReclutamientoRepository;
import pe.albrugroup.recruitment_service.repository.PostulacionRepository;
import pe.albrugroup.recruitment_service.service.mapper.GrupoCapacitacionMapper;

import java.time.LocalDate;
import java.util.Set;

@Service
@Transactional
@RequiredArgsConstructor
public class GrupoCapacitacionService {

    private static final Set<String> GRUPO_SORT_FIELDS = Set.of(
            "id", "codigo", "turno", "sala", "fechaInicio", "fechaFin", "estado", "createdAt"
    );

    private final GrupoCapacitacionRepository grupoCapacitacionRepository;
    private final GrupoCapacitacionDetalleRepository detalleRepository;
    private final GestionReclutamientoRepository gestionReclutamientoRepository;
    private final PostulacionRepository postulacionRepository;
    private final GrupoCapacitacionMapper grupoCapacitacionMapper;
    private final EventoService eventoService;
    private final PaginationService paginationService;
    private final PostulacionRealtimeNotifier postulacionRealtimeNotifier;
    private final GrupoCapacitacionRealtimeNotifier grupoCapacitacionRealtimeNotifier;

    public GrupoCapacitacionResponse crearGrupo(GrupoCapacitacionRequest request) {
        validarCodigoGrupoUnico(request.getCodigo());

        GrupoCapacitacion grupo = grupoCapacitacionMapper.toEntity(request);
        grupo.setFechaFin(calcularFechaFin(request.getFechaInicio()));
        grupo.setEstado(EstadoGrupoCapacitacion.ABIERTO);

        GrupoCapacitacion grupoGuardado = grupoCapacitacionRepository.save(grupo);
        grupoCapacitacionRealtimeNotifier.publishAfterCommit(
                "REGISTRO_GRUPO_CAPACITACION",
                "CAPACITACION",
                grupoGuardado
        );
        return grupoCapacitacionMapper.toResponse(grupoGuardado);
    }

    @Transactional(readOnly = true)
    public PageResponse<GrupoCapacitacionResponse> listarGrupos(
            EstadoGrupoCapacitacion estado,
            PageRequest pageRequest
    ) {
        Page<GrupoCapacitacionResponse> grupos = (estado == null
                ? grupoCapacitacionRepository.findAll(paginationService.toPageable(pageRequest, GRUPO_SORT_FIELDS))
                : grupoCapacitacionRepository.findByEstado(
                        estado,
                        paginationService.toPageable(pageRequest, GRUPO_SORT_FIELDS)
                ))
                .map(grupoCapacitacionMapper::toResumenResponse);
        return PageResponse.from(grupos);
    }

    @Transactional(readOnly = true)
    public java.util.List<GrupoCapacitacionResponse> listarAgenda(LocalDate desde, LocalDate hasta) {
        return grupoCapacitacionRepository
                .findByFechaInicioBetweenOrderByFechaInicioAscTurnoAsc(desde, hasta)
                .stream()
                .map(grupoCapacitacionMapper::toResumenResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public GrupoCapacitacionResponse obtenerGrupo(Long idGrupoCapacitacion) {
        return grupoCapacitacionMapper.toResponse(obtenerGrupoConDetalles(idGrupoCapacitacion));
    }

    public GrupoCapacitacionDetalleResponse agregarPostulacion(
            Long idGrupoCapacitacion,
            AgregarPostulacionGrupoCapacitacionRequest request
    ) {
        GrupoCapacitacion grupo = obtenerGrupoConDetalles(idGrupoCapacitacion);
        Postulacion postulacion = obtenerPostulacion(request.getIdPostulacion());
        Etapa etapaAnterior = postulacion.getEtapa();
        EstadoPostulacion estadoAnterior = postulacion.getEstado();
        EstadoBandejaPostulacion estadoBandejaAnterior = postulacion.getEstadoBandeja();

        validarGrupoDisponible(grupo);
        validarPostulacionAptaParaCapacitacion(postulacion);
        validarPostulacionSinGrupoPrevio(postulacion.getId());

        GrupoCapacitacionDetalle detalle = GrupoCapacitacionDetalle.builder()
                .grupoCapacitacion(grupo)
                .postulacion(postulacion)
                .estadoCapacitacion(EstadoCapacitacionPostulante.ASIGNADO)
                .fechaAsignacion(grupo.getFechaInicio())
                .build();

        GrupoCapacitacionDetalle detalleGuardado = detalleRepository.save(detalle);
        eventoService.registrarEvento(
                postulacion,
                Accion.ASIGNACION_GRUPO_CAPACITACION,
                null,
                null,
                null,
                null,
                null,
                "Asignado al grupo de capacitacion " + grupo.getCodigo()
        );

        postulacionRealtimeNotifier.publishAfterCommit(
                "ASIGNACION_GRUPO_CAPACITACION",
                "CAPACITACION",
                postulacion,
                etapaAnterior,
                estadoAnterior,
                estadoBandejaAnterior,
                grupo.getId(),
                postulacion.getPuestoObjetivo()
        );
        grupoCapacitacionRealtimeNotifier.publishAfterCommit(
                "ACTUALIZACION_GRUPO_CAPACITACION",
                "CAPACITACION",
                grupo
        );

        return grupoCapacitacionMapper.toResponse(detalleGuardado);
    }

    public java.util.List<GrupoCapacitacionDetalleResponse> agregarPostulaciones(
            Long idGrupoCapacitacion,
            java.util.List<Long> idsPostulaciones
    ) {
        return idsPostulaciones.stream()
                .map(id -> agregarPostulacion(
                        idGrupoCapacitacion,
                        AgregarPostulacionGrupoCapacitacionRequest.builder().idPostulacion(id).build()
                ))
                .toList();
    }

    public void retirarPostulacion(Long idGrupoCapacitacion, Long idPostulacion) {
        GrupoCapacitacion grupo = obtenerGrupoConDetalles(idGrupoCapacitacion);
        GrupoCapacitacionDetalle detalle = detalleRepository
                .findByGrupoCapacitacionIdAndPostulacionId(idGrupoCapacitacion, idPostulacion)
                .orElseThrow(() -> new NotFoundException(
                        "No existe un detalle de capacitacion para la postulacion indicada en el grupo enviado"
                ));
        validarGrupoAbiertoParaMovimiento(grupo);

        Postulacion postulacion = detalle.getPostulacion();
        Etapa etapaAnterior = postulacion.getEtapa();
        EstadoPostulacion estadoAnterior = postulacion.getEstado();
        EstadoBandejaPostulacion estadoBandejaAnterior = postulacion.getEstadoBandeja();

        // El postulante permanece aprobado en etapa CAPACITACION; al quedarse sin detalle
        // reaparece en la bandeja de aprobados sin grupo (no vuelve a RECLUTAMIENTO).
        detalleRepository.delete(detalle);

        eventoService.registrarEvento(
                postulacion,
                Accion.RETIRO_GRUPO_CAPACITACION,
                null, null, null, null, null,
                "Retirado del grupo de capacitacion " + grupo.getCodigo()
        );

        postulacionRealtimeNotifier.publishAfterCommit(
                "RETIRO_GRUPO_CAPACITACION",
                "CAPACITACION",
                postulacion,
                etapaAnterior,
                estadoAnterior,
                estadoBandejaAnterior,
                null,
                postulacion.getPuestoObjetivo()
        );
        grupoCapacitacionRealtimeNotifier.publishAfterCommit(
                "ACTUALIZACION_GRUPO_CAPACITACION",
                "CAPACITACION",
                grupo
        );
    }

    public java.util.List<GrupoCapacitacionDetalleResponse> trasladarPostulaciones(
            Long idGrupoDestino,
            Long idGrupoOrigen,
            java.util.List<Long> idsPostulaciones
    ) {
        if (idGrupoOrigen.equals(idGrupoDestino)) {
            throw new BadRequestException("El grupo de origen y el de destino no pueden ser el mismo");
        }
        GrupoCapacitacion origen = obtenerGrupoConDetalles(idGrupoOrigen);
        GrupoCapacitacion destino = obtenerGrupoConDetalles(idGrupoDestino);
        validarGrupoAbiertoParaMovimiento(origen);
        validarGrupoAbiertoParaMovimiento(destino);

        java.util.List<GrupoCapacitacionDetalleResponse> resultados = new java.util.ArrayList<>();
        for (Long idPostulacion : idsPostulaciones) {
            GrupoCapacitacionDetalle detalle = detalleRepository
                    .findByGrupoCapacitacionIdAndPostulacionId(idGrupoOrigen, idPostulacion)
                    .orElseThrow(() -> new NotFoundException(
                            "La postulacion " + idPostulacion + " no pertenece al grupo de origen indicado"
                    ));
            Postulacion postulacion = detalle.getPostulacion();
            Etapa etapaAnterior = postulacion.getEtapa();
            EstadoPostulacion estadoAnterior = postulacion.getEstado();
            EstadoBandejaPostulacion estadoBandejaAnterior = postulacion.getEstadoBandeja();

            detalle.setGrupoCapacitacion(destino);
            detalle.setEstadoCapacitacion(EstadoCapacitacionPostulante.ASIGNADO);
            detalle.setFechaAsignacion(destino.getFechaInicio());
            GrupoCapacitacionDetalle detalleGuardado = detalleRepository.save(detalle);

            eventoService.registrarEvento(
                    postulacion,
                    Accion.TRASLADO_GRUPO_CAPACITACION,
                    null, null, null, null, null,
                    "Trasladado del grupo " + origen.getCodigo() + " al grupo " + destino.getCodigo()
            );
            postulacionRealtimeNotifier.publishAfterCommit(
                    "TRASLADO_GRUPO_CAPACITACION",
                    "CAPACITACION",
                    postulacion,
                    etapaAnterior,
                    estadoAnterior,
                    estadoBandejaAnterior,
                    destino.getId(),
                    postulacion.getPuestoObjetivo()
            );
            resultados.add(grupoCapacitacionMapper.toResponse(detalleGuardado));
        }

        grupoCapacitacionRealtimeNotifier.publishAfterCommit(
                "ACTUALIZACION_GRUPO_CAPACITACION", "CAPACITACION", origen);
        grupoCapacitacionRealtimeNotifier.publishAfterCommit(
                "ACTUALIZACION_GRUPO_CAPACITACION", "CAPACITACION", destino);
        return resultados;
    }

    public GrupoCapacitacionResponse reprogramarGrupo(Long idGrupoCapacitacion, LocalDate nuevaFechaInicio) {
        GrupoCapacitacion grupo = obtenerGrupoConDetalles(idGrupoCapacitacion);
        validarGrupoAbiertoParaMovimiento(grupo);

        LocalDate fechaAnterior = grupo.getFechaInicio();
        if (!nuevaFechaInicio.equals(fechaAnterior)) {
            grupo.setFechaInicio(nuevaFechaInicio);
            grupo.setFechaFin(calcularFechaFin(nuevaFechaInicio));

            // Las fechas de asignacion siguen al nuevo inicio; se registra la reprogramacion en la
            // traza de cada postulante asignado (la traza es por postulacion). Grupo sin postulantes
            // solo cambia de fecha, sin evento.
            for (GrupoCapacitacionDetalle detalle : grupo.getDetalles()) {
                detalle.setFechaAsignacion(nuevaFechaInicio);
                eventoService.registrarEvento(
                        detalle.getPostulacion(),
                        Accion.REPROGRAMACION_GRUPO_CAPACITACION,
                        null, null, null, null, null,
                        "Reprogramado el grupo " + grupo.getCodigo() + " del " + fechaAnterior + " al " + nuevaFechaInicio
                );
            }

            grupoCapacitacionRepository.save(grupo);
            grupoCapacitacionRealtimeNotifier.publishAfterCommit(
                    "ACTUALIZACION_GRUPO_CAPACITACION", "CAPACITACION", grupo);
        }

        return grupoCapacitacionMapper.toResponse(grupo);
    }

    public GrupoCapacitacionDetalleResponse actualizarDetalle(
            Long idGrupoCapacitacion,
            Long idPostulacion,
            ActualizarDetalleGrupoCapacitacionRequest request
    ) {
        GrupoCapacitacionDetalle detalle = detalleRepository.findByGrupoCapacitacionIdAndPostulacionId(idGrupoCapacitacion, idPostulacion)
                .orElseThrow(() -> new NotFoundException(
                        "No existe un detalle de capacitacion para la postulacion indicada en el grupo enviado"
                ));
        Postulacion postulacion = detalle.getPostulacion();
        Etapa etapaAnterior = postulacion.getEtapa();
        EstadoPostulacion estadoAnterior = postulacion.getEstado();
        EstadoBandejaPostulacion estadoBandejaAnterior = postulacion.getEstadoBandeja();

        validarActualizacionDetalle(request);

        if (request.getEstadoCapacitacion() != null) {
            detalle.setEstadoCapacitacion(request.getEstadoCapacitacion());
        }
        if (request.getFechaResultado() != null) {
            detalle.setFechaResultado(request.getFechaResultado());
        }
        if (request.getIdEmpleadoContratado() != null) {
            detalle.setIdEmpleadoContratado(request.getIdEmpleadoContratado());
        }
        if (request.getFechaContratacion() != null) {
            detalle.setFechaContratacion(request.getFechaContratacion());
        }
        if (request.getCumplioTresMeses() != null) {
            detalle.setCumplioTresMeses(request.getCumplioTresMeses());
        }
        if (request.getFechaCumplioTresMeses() != null) {
            detalle.setFechaCumplioTresMeses(request.getFechaCumplioTresMeses());
        }

        GrupoCapacitacionDetalle detalleGuardado = detalleRepository.save(detalle);
        registrarEventoResultadoCapacitacion(detalleGuardado);
        postulacionRealtimeNotifier.publishAfterCommit(
                "ACTUALIZACION_DETALLE_CAPACITACION",
                "CAPACITACION",
                postulacion,
                etapaAnterior,
                estadoAnterior,
                estadoBandejaAnterior,
                detalleGuardado.getGrupoCapacitacion().getId(),
                postulacion.getPuestoObjetivo()
        );
        grupoCapacitacionRealtimeNotifier.publishAfterCommit(
                "ACTUALIZACION_GRUPO_CAPACITACION",
                "CAPACITACION",
                detalleGuardado.getGrupoCapacitacion()
        );
        return grupoCapacitacionMapper.toResponse(detalleGuardado);
    }

    private void registrarEventoResultadoCapacitacion(GrupoCapacitacionDetalle detalle) {
        if (detalle.getEstadoCapacitacion() == EstadoCapacitacionPostulante.APROBADO) {
            eventoService.registrarEvento(
                    detalle.getPostulacion(),
                    Accion.APROBACION_CAPACITACION,
                    null,
                    null,
                    null,
                    null,
                    null,
                    "Aprobado en el grupo de capacitacion " + detalle.getGrupoCapacitacion().getCodigo()
            );
        }

        if (detalle.getEstadoCapacitacion() == EstadoCapacitacionPostulante.DESAPROBADO) {
            eventoService.registrarEvento(
                    detalle.getPostulacion(),
                    Accion.DESAPROBACION_CAPACITACION,
                    null,
                    null,
                    null,
                    null,
                    null,
                    "Desaprobado en el grupo de capacitacion " + detalle.getGrupoCapacitacion().getCodigo()
            );
        }
    }

    private GrupoCapacitacion obtenerGrupoConDetalles(Long idGrupoCapacitacion) {
        return grupoCapacitacionRepository.findWithDetallesById(idGrupoCapacitacion)
                .orElseThrow(() -> new NotFoundException(GrupoCapacitacion.class, idGrupoCapacitacion));
    }

    private Postulacion obtenerPostulacion(Long idPostulacion) {
        return postulacionRepository.findById(idPostulacion)
                .orElseThrow(() -> new NotFoundException(Postulacion.class, idPostulacion));
    }

    private void validarCodigoGrupoUnico(String codigo) {
        if (grupoCapacitacionRepository.existsByCodigo(codigo)) {
            throw new ConflictException("Ya existe un grupo de capacitacion con el codigo indicado");
        }
    }

    private LocalDate calcularFechaFin(LocalDate fechaInicio) {
        return fechaInicio.plusWeeks(1);
    }

    private void validarGrupoDisponible(GrupoCapacitacion grupo) {
        if (grupo.getEstado() == EstadoGrupoCapacitacion.CERRADO || grupo.getEstado() == EstadoGrupoCapacitacion.ANULADO) {
            throw new BadRequestException("No se pueden agregar postulaciones a un grupo de capacitacion cerrado o anulado");
        }
    }

    private void validarGrupoAbiertoParaMovimiento(GrupoCapacitacion grupo) {
        if (grupo.getEstado() != EstadoGrupoCapacitacion.ABIERTO) {
            throw new BadRequestException(
                    "Solo se pueden mover o retirar postulantes mientras el grupo esta ABIERTO (aun no inicia)"
            );
        }
    }

    private void validarPostulacionAptaParaCapacitacion(Postulacion postulacion) {
        if (postulacion.getEtapa() == Etapa.RECLUTAMIENTO) {
            boolean aprobada = gestionReclutamientoRepository.findById(postulacion.getId())
                    .map(g -> "APROBADO".equals(g.getResultadoEvaluacion()))
                    .orElse(false);
            if (!aprobada) {
                throw new BadRequestException("Solo se pueden asignar postulaciones aprobadas en reclutamiento");
            }
            postulacion.setEtapa(Etapa.CAPACITACION);
            postulacionRepository.save(postulacion);
            return;
        }
        if (postulacion.getEtapa() != Etapa.CAPACITACION) {
            throw new BadRequestException("Solo se pueden agregar postulaciones aprobadas a capacitacion");
        }

        if (postulacion.getPuestoObjetivo() != PuestoObjetivo.ASESOR_VENTAS) {
            throw new BadRequestException("Solo se pueden agregar postulaciones del puesto objetivo ASESOR_VENTAS");
        }
    }

    private void validarPostulacionSinGrupoPrevio(Long idPostulacion) {
        if (detalleRepository.existsByPostulacionId(idPostulacion)) {
            throw new ConflictException("La postulacion indicada ya fue asignada a un grupo de capacitacion");
        }
    }

    private void validarActualizacionDetalle(ActualizarDetalleGrupoCapacitacionRequest request) {
        if (request.getFechaContratacion() != null && request.getIdEmpleadoContratado() == null) {
            throw new BadRequestException("No se puede registrar fecha de contratacion sin idEmpleadoContratado");
        }

        if (Boolean.TRUE.equals(request.getCumplioTresMeses()) && request.getIdEmpleadoContratado() == null) {
            throw new BadRequestException("No se puede marcar cumplimiento de tres meses sin idEmpleadoContratado");
        }
    }
}
