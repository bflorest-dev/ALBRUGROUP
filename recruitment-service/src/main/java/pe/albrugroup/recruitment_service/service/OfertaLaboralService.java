package pe.albrugroup.recruitment_service.service;

import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.albrugroup.recruitment_service.configuration.CacheNames;
import pe.albrugroup.recruitment_service.configuration.CurrentUser;
import pe.albrugroup.recruitment_service.entity.OfertaAmpliacion;
import pe.albrugroup.recruitment_service.entity.OfertaLaboral;
import pe.albrugroup.recruitment_service.entity.enums.EstadoOferta;
import pe.albrugroup.recruitment_service.entity.request.ActualizarEstadoOfertaLaboralRequest;
import pe.albrugroup.recruitment_service.entity.request.OfertaAmpliacionRequest;
import pe.albrugroup.recruitment_service.entity.request.OfertaLaboralRequest;
import pe.albrugroup.recruitment_service.entity.request.PageRequest;
import pe.albrugroup.recruitment_service.entity.response.OfertaAmpliacionResponse;
import pe.albrugroup.recruitment_service.entity.response.OfertaLaboralResponse;
import pe.albrugroup.recruitment_service.entity.response.PageResponse;
import pe.albrugroup.recruitment_service.exception.BadRequestException;
import pe.albrugroup.recruitment_service.exception.ConflictException;
import pe.albrugroup.recruitment_service.exception.NotFoundException;
import pe.albrugroup.recruitment_service.repository.OfertaAmpliacionRepository;
import pe.albrugroup.recruitment_service.repository.OfertaLaboralRepository;
import pe.albrugroup.recruitment_service.service.mapper.OfertaMapper;

import java.util.List;
import java.util.Set;

@Service @Transactional
@RequiredArgsConstructor
public class OfertaLaboralService {

    private static final Set<String> OFERTA_SORT_FIELDS = Set.of(
            "id", "codigo", "negocio", "puestoObjetivo", "modalidad", "horario",
            "cantidadInicial", "plazoInicial", "estado", "createdAt"
    );

    private final OfertaLaboralRepository ofertaRepository;
    private final OfertaAmpliacionRepository ampliacionRepository;
    private final OfertaMapper ofertaMapper;
    private final CurrentUser currentUser;
    private final PaginationService paginationService;


    @CacheEvict(value = CacheNames.OFERTAS_ACTIVAS, allEntries = true)
    public OfertaLaboralResponse registrarOfertaLaboral(OfertaLaboralRequest request) {
        validarCodigoUnico(request.getCodigo());
        validarNoExisteOfertaEquivalenteActiva(request);

        OfertaLaboral oferta = ofertaMapper.toEntity(request);
        oferta.setIdSolicitante(currentUser.empleadoID());
        oferta.setEstado(EstadoOferta.ACTIVO);
        return ofertaMapper.toResponse(ofertaRepository.save(oferta));
    }

    @Transactional(readOnly = true)
    @Cacheable(value = CacheNames.OFERTAS_ACTIVAS, key = "'activas'")
    public List<OfertaLaboralResponse> listarOfertasActivas() {
        return ofertaRepository.findByEstadoOrderByCreatedAtDesc(EstadoOferta.ACTIVO).stream()
                .map(ofertaMapper::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public PageResponse<OfertaLaboralResponse> listarOfertasLaborales(
            EstadoOferta estado,
            PageRequest pageRequest
    ) {
        Page<OfertaLaboralResponse> ofertas = (estado == null
                ? ofertaRepository.findAll(paginationService.toPageable(pageRequest, OFERTA_SORT_FIELDS))
                : ofertaRepository.findByEstado(
                        estado,
                        paginationService.toPageable(pageRequest, OFERTA_SORT_FIELDS)
                ))
                .map(ofertaMapper::toResponse);
        return PageResponse.from(ofertas);
    }

    @CacheEvict(value = CacheNames.OFERTAS_ACTIVAS, allEntries = true)
    public OfertaAmpliacionResponse registrarAmpliacion(Long idOfertaLaboral, OfertaAmpliacionRequest request) {
        OfertaLaboral oferta = ofertaRepository.findById(idOfertaLaboral)
                .orElseThrow(() -> new NotFoundException(OfertaLaboral.class, idOfertaLaboral));
        validarOfertaActiva(oferta);
        validarPlazoAmpliacion(oferta, request);

        OfertaAmpliacion ampliacion = ofertaMapper.toEntity(request);
        ampliacion.setIdSolicitante(currentUser.empleadoID());
        ampliacion.setOfertaLaboral(oferta);
        return ofertaMapper.toResponse(ampliacionRepository.save(ampliacion));
    }

    @CacheEvict(value = CacheNames.OFERTAS_ACTIVAS, allEntries = true)
    public OfertaLaboralResponse actualizarEstadoOfertaLaboral(
            Long idOfertaLaboral,
            ActualizarEstadoOfertaLaboralRequest request
    ) {
        OfertaLaboral oferta = ofertaRepository.findById(idOfertaLaboral)
                .orElseThrow(() -> new NotFoundException(OfertaLaboral.class, idOfertaLaboral));

        validarCambioEstado(oferta, request.getEstado());
        oferta.setEstado(request.getEstado());
        return ofertaMapper.toResponse(ofertaRepository.save(oferta));
    }

    private void validarCodigoUnico(String codigo) {
        if (ofertaRepository.existsByCodigo(codigo)) {
            throw new ConflictException("Ya existe una oferta laboral con el codigo indicado");
        }
    }

    private void validarNoExisteOfertaEquivalenteActiva(OfertaLaboralRequest request) {
        boolean existeEquivalente = ofertaRepository.existsByEstadoAndNegocioAndPuestoObjetivoAndModalidadAndHorario(
                EstadoOferta.ACTIVO,
                request.getNegocio(),
                request.getPuestoObjetivo(),
                request.getModalidad(),
                request.getHorario()
        );
        if (existeEquivalente) {
            throw new ConflictException("Ya existe una oferta activa equivalente para negocio, puesto objetivo, modalidad y horario");
        }
    }

    private void validarOfertaActiva(OfertaLaboral oferta) {
        if (oferta.getEstado() != EstadoOferta.ACTIVO) {
            throw new BadRequestException("Solo se pueden registrar ampliaciones sobre ofertas activas");
        }
    }

    private void validarPlazoAmpliacion(OfertaLaboral oferta, OfertaAmpliacionRequest request) {
        if (request.getPlazo().isBefore(oferta.getPlazoInicial())) {
            throw new BadRequestException("El plazo de la ampliacion no puede ser menor al plazo inicial de la oferta");
        }

        ampliacionRepository.findTopByOfertaLaboralIdOrderByPlazoDescIdDesc(oferta.getId())
                .ifPresent(ultimaAmpliacion -> {
                    if (request.getPlazo().isBefore(ultimaAmpliacion.getPlazo())) {
                        throw new BadRequestException("El plazo de la ampliacion no puede ser menor al de la ultima ampliacion registrada");
                    }
                });
    }

    private void validarCambioEstado(OfertaLaboral oferta, EstadoOferta nuevoEstado) {
        if (oferta.getEstado() == nuevoEstado) {
            throw new BadRequestException("La oferta laboral ya se encuentra en el estado indicado");
        }

        switch (oferta.getEstado()) {
            case ACTIVO -> {
                return;
            }
            case CERRADO -> {
                if (nuevoEstado == EstadoOferta.ACTIVO
                        || nuevoEstado == EstadoOferta.CANCELADO
                        || nuevoEstado == EstadoOferta.COMPLETADO) {
                    return;
                }
            }
            case CANCELADO, COMPLETADO -> {
                throw new BadRequestException("No se puede cambiar el estado de una oferta laboral cancelada o completada");
            }
        }

        throw new BadRequestException("La transicion de estado indicada no esta permitida para la oferta laboral");
    }
}
