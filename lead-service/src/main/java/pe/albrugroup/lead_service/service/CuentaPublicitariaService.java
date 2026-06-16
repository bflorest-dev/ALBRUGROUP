package pe.albrugroup.lead_service.service;

import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.albrugroup.lead_service.configuration.CacheNames;
import pe.albrugroup.lead_service.entity.CuentaPublicitaria;
import pe.albrugroup.lead_service.entity.request.ActualizarNombreCuentaRequest;
import pe.albrugroup.lead_service.entity.request.CuentaPublicitariaRequest;
import pe.albrugroup.lead_service.entity.response.CuentaPublicitariaResponse;
import pe.albrugroup.lead_service.exception.NotFoundException;
import pe.albrugroup.lead_service.repository.CuentaPublicitariaRepository;
import pe.albrugroup.lead_service.service.mapper.CuentaPublicitariaMapper;

import java.util.List;

@Service @Transactional
@RequiredArgsConstructor
public class CuentaPublicitariaService {

    private final CuentaPublicitariaMapper mapper;
    private final CuentaPublicitariaRepository repository;

    @CacheEvict(value = CacheNames.CUENTAS_PUBLICITARIAS, allEntries = true)
    public CuentaPublicitariaResponse registrarCuentaPublicitaria(CuentaPublicitariaRequest request) {
        CuentaPublicitaria cuentaPublicitaria = mapper.toEntity(request);
        cuentaPublicitaria.setActivo(Boolean.TRUE);
        return mapper.toResponse(repository.save(cuentaPublicitaria));
    }

    @CacheEvict(value = CacheNames.CUENTAS_PUBLICITARIAS, allEntries = true)
    public CuentaPublicitariaResponse actualizarNombreCuentaPublicitaria(
            Long idCuentaPublicitaria,
            ActualizarNombreCuentaRequest request) {
        CuentaPublicitaria cuenta = repository.findById(idCuentaPublicitaria)
                .orElseThrow(() -> new NotFoundException(CuentaPublicitaria.class, idCuentaPublicitaria));
        cuenta.setNombreCuenta(request.getNombreCuenta());
        return mapper.toResponse(repository.save(cuenta));
    }

    @CacheEvict(value = CacheNames.CUENTAS_PUBLICITARIAS, allEntries = true)
    public CuentaPublicitariaResponse alternarEstadoCuentaPublicitaria(Long idCuentaPublicitaria) {
        CuentaPublicitaria cuentaPublicitaria = repository.findById(idCuentaPublicitaria)
                .orElseThrow(() -> new NotFoundException(CuentaPublicitaria.class, idCuentaPublicitaria));
        cuentaPublicitaria.setActivo(!Boolean.TRUE.equals(cuentaPublicitaria.getActivo()));
        return mapper.toResponse(repository.save(cuentaPublicitaria));
    }

    @Transactional(readOnly = true)
    @Cacheable(value = CacheNames.CUENTAS_PUBLICITARIAS, key = "#activo == null ? 'all' : #activo")
    public List<CuentaPublicitariaResponse> listarCuentasPublicitarias(Boolean activo) {
        return repository.listarPorActivo(activo).stream()
                .map(mapper::toResponse)
                .toList();
    }
}
