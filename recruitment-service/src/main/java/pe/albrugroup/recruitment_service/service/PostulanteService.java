package pe.albrugroup.recruitment_service.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.albrugroup.recruitment_service.entity.Postulante;
import pe.albrugroup.recruitment_service.entity.request.PostulanteRequest;
import pe.albrugroup.recruitment_service.repository.PostulanteRepository;
import pe.albrugroup.recruitment_service.service.mapper.PostulacionMapper;

@Service
@Transactional
@RequiredArgsConstructor
public class PostulanteService {

    private final PostulanteRepository postulanteRepository;
    private final PostulacionMapper postulacionMapper;

    public Postulante crearOActualizar(PostulanteRequest request) {
        Postulante postulante = postulanteRepository.findByTipoDocumentoAndDocumento(
                        request.getTipoDocumento(),
                        request.getDocumento()
                )
                .orElseGet(() -> {
                    Postulante nuevoPostulante = postulacionMapper.toEntity(request);
                    nuevoPostulante.setListaNegra(Boolean.FALSE);
                    return nuevoPostulante;
                });

        postulante.setNombres(request.getNombres());
        postulante.setApellidos(request.getApellidos());
        postulante.setTipoDocumento(request.getTipoDocumento());
        postulante.setDocumento(request.getDocumento());
        postulante.setCelular(request.getCelular());
        postulante.setFechaNacimiento(request.getFechaNacimiento());
        if (postulante.getListaNegra() == null) {
            postulante.setListaNegra(Boolean.FALSE);
        }

        return postulanteRepository.save(postulante);
    }
}
