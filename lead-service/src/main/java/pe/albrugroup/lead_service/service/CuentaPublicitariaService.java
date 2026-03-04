package pe.albrugroup.lead_service.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.albrugroup.lead_service.entity.CuentaPublicitaria;
import pe.albrugroup.lead_service.entity.request.CuentaPublicitariaRequest;
import pe.albrugroup.lead_service.entity.response.CuentaPublicitariaResponse;
import pe.albrugroup.lead_service.exception.CuentaPublicitariaNotFoundException;
import pe.albrugroup.lead_service.repository.CuentaPublicitariaRepository;
import pe.albrugroup.lead_service.service.mapper.CuentaPublicitariaMapper;

import java.util.List;

@Service @Transactional
@RequiredArgsConstructor
public class CuentaPublicitariaService {

    private final CuentaPublicitariaMapper mapper;
    private final CuentaPublicitariaRepository repository;

    public CuentaPublicitariaResponse registrarCuentaPublicitaria(CuentaPublicitariaRequest request) {
        CuentaPublicitaria cuentaPublicitaria = mapper.toEntity(request);
        cuentaPublicitaria.setActivo(Boolean.TRUE);
        return mapper.toResponse(repository.save(cuentaPublicitaria));
    }

    public CuentaPublicitariaResponse desactivarCuentaPublicitaria(Long idCuentaPublicitaria) {
        CuentaPublicitaria cuentaPublicitaria = repository.findByIdAndActivoTrue(idCuentaPublicitaria)
                .orElseThrow(() -> new CuentaPublicitariaNotFoundException(idCuentaPublicitaria));
        cuentaPublicitaria.setActivo(Boolean.FALSE);
        return mapper.toResponse(repository.save(cuentaPublicitaria));
    }

    @Transactional(readOnly = true)
    public List<CuentaPublicitariaResponse> listarCuentasPublicitarias(Boolean activo) {
        return repository.listarPorActivo(activo).stream()
                .map(mapper::toResponse)
                .toList();
    }
}
