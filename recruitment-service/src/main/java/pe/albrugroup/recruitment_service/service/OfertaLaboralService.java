package pe.albrugroup.recruitment_service.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.albrugroup.recruitment_service.entity.enums.EstadoOferta;
import pe.albrugroup.recruitment_service.entity.request.OfertaLaboralRequest;
import pe.albrugroup.recruitment_service.entity.response.OfertaLaboralResponse;
import pe.albrugroup.recruitment_service.repository.OfertaLaboralRepository;
import pe.albrugroup.recruitment_service.service.mapper.OfertaAmpliacionMapper;
import pe.albrugroup.recruitment_service.service.mapper.OfertaLaboralMapper;

import java.util.List;

@Service @Transactional
@RequiredArgsConstructor
public class OfertaLaboralService {

    private final OfertaLaboralRepository ofertaRepository;
    private final OfertaLaboralMapper ofertaMapper;
    private final OfertaAmpliacionMapper ampliacionMapper;


    public OfertaLaboralResponse registrarOfertaLaboral(OfertaLaboralRequest request) {

    }

    public List<OfertaLaboralResponse> listarOfertasLaborales(EstadoOferta estado) {

    }
}
