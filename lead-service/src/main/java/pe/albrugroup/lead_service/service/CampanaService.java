package pe.albrugroup.lead_service.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.albrugroup.lead_service.entity.Campana;
import pe.albrugroup.lead_service.entity.CuentaPublicitaria;
import pe.albrugroup.lead_service.entity.request.CampanaRequest;
import pe.albrugroup.lead_service.entity.response.CampanaResponse;
import pe.albrugroup.lead_service.exception.CampanaNotFoundException;
import pe.albrugroup.lead_service.exception.CuentaPublicitariaNotFoundException;
import pe.albrugroup.lead_service.repository.CampanaRepository;
import pe.albrugroup.lead_service.repository.CuentaPublicitariaRepository;
import pe.albrugroup.lead_service.service.mapper.CampanaMapper;

import java.util.List;

@Service @Transactional
@RequiredArgsConstructor
public class CampanaService {

    private final CampanaMapper mapper;
    private final CampanaRepository repository;
    private final CuentaPublicitariaRepository cuentaPublicitariaRepository;

    public CampanaResponse registrarCampana(CampanaRequest request) {
        CuentaPublicitaria cuentaPublicitaria = cuentaPublicitariaRepository.findByIdAndActivoTrue(request.getIdCuentaPublicitaria())
                .orElseThrow(() -> new CuentaPublicitariaNotFoundException(request.getIdCuentaPublicitaria()));
        Campana campana = mapper.toEntity(request);
        campana.setCuentaPublicitaria(cuentaPublicitaria);
        campana.setActivo(Boolean.TRUE);
        return mapper.toResponse(repository.save(campana));
    }

    public CampanaResponse actualizarCampana(Long idCampana, CampanaRequest request) {
        Campana campana = repository.findByIdAndActivoTrue(idCampana)
                .orElseThrow(() -> new CampanaNotFoundException(idCampana));
        CuentaPublicitaria cuentaPublicitaria = cuentaPublicitariaRepository.findByIdAndActivoTrue(request.getIdCuentaPublicitaria())
                .orElseThrow(() -> new CuentaPublicitariaNotFoundException(request.getIdCuentaPublicitaria()));
        mapper.updateDatosCampana(request, campana);
        campana.setCuentaPublicitaria(cuentaPublicitaria);
        return mapper.toResponse(repository.save(campana));
    }

    public CampanaResponse desactivarCampana(Long idCampana) {
        Campana campana = repository.findByIdAndActivoTrue(idCampana)
                .orElseThrow(() -> new CampanaNotFoundException(idCampana));
        campana.setActivo(Boolean.FALSE);
        return mapper.toResponse(repository.save(campana));
    }

    @Transactional(readOnly = true)
    public List<CampanaResponse> listarCampanas(Boolean activo) {
        return repository.listarPorActivo(activo).stream()
                .map(mapper::toResponse)
                .toList();
    }
}
