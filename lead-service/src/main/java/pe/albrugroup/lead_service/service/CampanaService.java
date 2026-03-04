package pe.albrugroup.lead_service.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.albrugroup.lead_service.entity.Campana;
import pe.albrugroup.lead_service.entity.request.CampanaRequest;
import pe.albrugroup.lead_service.entity.response.CampanaResponse;
import pe.albrugroup.lead_service.exception.CampanaNotFoundException;
import pe.albrugroup.lead_service.repository.CampanaRepository;
import pe.albrugroup.lead_service.service.mapper.CampanaMapper;

@Service @Transactional
@RequiredArgsConstructor
public class CampanaService {

    private final CampanaMapper mapper;
    private final CampanaRepository repository;

    public CampanaResponse registrarCampana(CampanaRequest request) {
        Campana campana = mapper.toEntity(request);
        return mapper.toResponse(campana);
    }

    public CampanaResponse actualizarCampana(Long idCampana, CampanaRequest request) {
        Campana campana = repository.findById(idCampana)
                .orElseThrow(() -> new CampanaNotFoundException(idCampana));
        mapper.updateDatosCampana(request, campana);
        return mapper.toResponse(campana);
    }
}
