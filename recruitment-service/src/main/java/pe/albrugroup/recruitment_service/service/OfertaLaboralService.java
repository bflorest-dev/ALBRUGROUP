package pe.albrugroup.recruitment_service.service;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import pe.albrugroup.recruitment_service.entity.OfertaAmpliacion;
import pe.albrugroup.recruitment_service.entity.OfertaLaboral;
import pe.albrugroup.recruitment_service.entity.enums.EstadoOferta;
import pe.albrugroup.recruitment_service.entity.request.OfertaAmpliacionRequest;
import pe.albrugroup.recruitment_service.entity.request.OfertaLaboralRequest;
import pe.albrugroup.recruitment_service.entity.response.OfertaAmpliacionResponse;
import pe.albrugroup.recruitment_service.entity.response.OfertaLaboralResponse;
import pe.albrugroup.recruitment_service.exception.NotFoundException;
import pe.albrugroup.recruitment_service.repository.OfertaAmpliacionRepository;
import pe.albrugroup.recruitment_service.repository.OfertaLaboralRepository;
import pe.albrugroup.recruitment_service.service.mapper.OfertaMapper;

import java.util.List;

@Service @Transactional
@RequiredArgsConstructor
public class OfertaLaboralService {

    private final OfertaLaboralRepository ofertaRepository;
    private final OfertaAmpliacionRepository ampliacionRepository;
    private final OfertaMapper ofertaMapper;


    public OfertaLaboralResponse registrarOfertaLaboral(OfertaLaboralRequest request) {
        validarCodigoUnico(request.getCodigo());
        validarNoExisteOfertaEquivalenteActiva(request);

        OfertaLaboral oferta = ofertaMapper.toEntity(request);
        oferta.setEstado(EstadoOferta.ACTIVO);
        return ofertaMapper.toResponse(ofertaRepository.save(oferta));
    }

    public List<OfertaLaboralResponse> listarOfertasLaborales(EstadoOferta estado) {
        List<OfertaLaboral> ofertas = estado == null
                ? ofertaRepository.findAllByOrderByCreatedAtDesc()
                : ofertaRepository.findByEstadoOrderByCreatedAtDesc(estado);
        return ofertas.stream()
                .map(ofertaMapper::toResponse)
                .toList();
    }

    public OfertaAmpliacionResponse registrarAmpliacion(Long idOfertaLaboral, OfertaAmpliacionRequest request) {
        OfertaLaboral oferta = ofertaRepository.findById(idOfertaLaboral)
                .orElseThrow(() -> new NotFoundException(OfertaLaboral.class, idOfertaLaboral));
        validarOfertaActiva(oferta);
        validarPlazoAmpliacion(oferta, request);

        OfertaAmpliacion ampliacion = ofertaMapper.toEntity(request);
        ampliacion.setOfertaLaboral(oferta);
        return ofertaMapper.toResponse(ampliacionRepository.save(ampliacion));
    }

    private void validarCodigoUnico(String codigo) {
        if (ofertaRepository.existsByCodigo(codigo)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Ya existe una oferta laboral con el codigo indicado"
            );
        }
    }

    private void validarNoExisteOfertaEquivalenteActiva(OfertaLaboralRequest request) {
        boolean existeEquivalente = ofertaRepository.existsByEstadoAndNegocioAndPuestoObjetivoAndHorario(
                EstadoOferta.ACTIVO,
                request.getNegocio(),
                request.getPuestoObjetivo(),
                request.getHorario()
        );
        if (existeEquivalente) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Ya existe una oferta activa equivalente para negocio, puesto objetivo y horario"
            );
        }
    }

    private void validarOfertaActiva(OfertaLaboral oferta) {
        if (oferta.getEstado() != EstadoOferta.ACTIVO) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Solo se pueden registrar ampliaciones sobre ofertas activas"
            );
        }
    }

    private void validarPlazoAmpliacion(OfertaLaboral oferta, OfertaAmpliacionRequest request) {
        if (request.getPlazo().isBefore(oferta.getPlazoInicial())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "El plazo de la ampliacion no puede ser menor al plazo inicial de la oferta"
            );
        }

        ampliacionRepository.findTopByOfertaLaboralIdOrderByPlazoDescIdDesc(oferta.getId())
                .ifPresent(ultimaAmpliacion -> {
                    if (request.getPlazo().isBefore(ultimaAmpliacion.getPlazo())) {
                        throw new ResponseStatusException(
                                HttpStatus.BAD_REQUEST,
                                "El plazo de la ampliacion no puede ser menor al de la ultima ampliacion registrada"
                        );
                    }
                });
    }
}
