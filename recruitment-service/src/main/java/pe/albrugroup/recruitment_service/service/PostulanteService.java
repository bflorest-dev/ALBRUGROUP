package pe.albrugroup.recruitment_service.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.albrugroup.recruitment_service.entity.Postulante;
import pe.albrugroup.recruitment_service.entity.enums.Documento;
import pe.albrugroup.recruitment_service.entity.request.ActualizarDatosPostulanteRequest;
import pe.albrugroup.recruitment_service.entity.request.PostulanteRequest;
import pe.albrugroup.recruitment_service.exception.BadRequestException;
import pe.albrugroup.recruitment_service.exception.ConflictException;
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

        String usuarioMeta = normalizarUsuarioMeta(request.getUsuarioMeta());
        validarUsuarioMetaDisponible(usuarioMeta, postulante.getId());

        postulante.setNombres(request.getNombres());
        postulante.setApellidos(request.getApellidos());
        postulante.setTipoDocumento(request.getTipoDocumento());
        postulante.setDocumento(request.getDocumento());
        postulante.setCelular(request.getCelular());
        if (request.getNumeroExclusivoLlamadas() != null) {
            postulante.setNumeroExclusivoLlamadas(request.getNumeroExclusivoLlamadas());
        }
        if (usuarioMeta != null) {
            postulante.setUsuarioMeta(usuarioMeta);
        }
        postulante.setFechaNacimiento(request.getFechaNacimiento());
        if (postulante.getListaNegra() == null) {
            postulante.setListaNegra(Boolean.FALSE);
        }

        return postulanteRepository.save(postulante);
    }

    public Postulante crearDesdeUsuarioMeta(String usuarioMeta) {
        String normalizado = normalizarUsuarioMeta(usuarioMeta);
        if (normalizado == null) {
            throw new BadRequestException("El usuario Meta es obligatorio");
        }
        validarUsuarioMetaDisponible(normalizado, null);

        return postulanteRepository.save(Postulante.builder()
                .usuarioMeta(normalizado)
                .listaNegra(Boolean.FALSE)
                .build());
    }

    public Postulante actualizarDatos(Postulante postulante, ActualizarDatosPostulanteRequest request) {
        String usuarioMeta = normalizarUsuarioMeta(request.getUsuarioMeta());
        String documento = normalizarTexto(request.getDocumento());
        Documento tipoDocumento = request.getTipoDocumento();

        if ((tipoDocumento == null) != (documento == null)) {
            throw new BadRequestException("Tipo y número de documento deben enviarse juntos");
        }

        validarUsuarioMetaDisponible(usuarioMeta, postulante.getId());
        if (tipoDocumento != null && postulanteRepository.findByTipoDocumentoAndDocumento(tipoDocumento, documento)
                .filter(otro -> !otro.getId().equals(postulante.getId()))
                .isPresent()) {
            throw new ConflictException("Ya existe un postulante con el tipo y número de documento indicado");
        }

        postulante.setNombres(normalizarTexto(request.getNombres()));
        postulante.setApellidos(normalizarTexto(request.getApellidos()));
        postulante.setTipoDocumento(tipoDocumento);
        postulante.setDocumento(documento);
        postulante.setCelular(normalizarTexto(request.getCelular()));
        postulante.setNumeroExclusivoLlamadas(normalizarTexto(request.getNumeroExclusivoLlamadas()));
        postulante.setUsuarioMeta(usuarioMeta);
        postulante.setFechaNacimiento(request.getFechaNacimiento());
        if (postulante.getListaNegra() == null) {
            postulante.setListaNegra(Boolean.FALSE);
        }

        return postulanteRepository.save(postulante);
    }

    public static String normalizarUsuarioMeta(String usuarioMeta) {
        if (usuarioMeta == null) {
            return null;
        }
        String normalizado = usuarioMeta.trim().replaceFirst("^@+", "").trim();
        return normalizado.isBlank() ? null : normalizado;
    }

    private void validarUsuarioMetaDisponible(String usuarioMeta, Long idPostulanteActual) {
        if (usuarioMeta == null) {
            return;
        }
        boolean existe = idPostulanteActual == null
                ? postulanteRepository.findByUsuarioMetaIgnoreCase(usuarioMeta).isPresent()
                : postulanteRepository.existsByUsuarioMetaIgnoreCaseAndIdNot(usuarioMeta, idPostulanteActual);
        if (existe) {
            throw new ConflictException("Ya existe un postulante con el usuario Meta indicado");
        }
    }

    private String normalizarTexto(String valor) {
        if (valor == null) {
            return null;
        }
        String normalizado = valor.trim();
        return normalizado.isBlank() ? null : normalizado;
    }
}
