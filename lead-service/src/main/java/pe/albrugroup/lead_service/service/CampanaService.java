package pe.albrugroup.lead_service.service;

import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.albrugroup.lead_service.configuration.CacheNames;
import pe.albrugroup.lead_service.entity.Campana;
import pe.albrugroup.lead_service.entity.CuentaPublicitaria;
import pe.albrugroup.lead_service.entity.Proveedor;
import pe.albrugroup.lead_service.entity.request.CampanaRequest;
import pe.albrugroup.lead_service.entity.request.CampanaWhatsappRequest;
import pe.albrugroup.lead_service.entity.response.CampanaResponse;
import pe.albrugroup.lead_service.exception.BadRequestException;
import pe.albrugroup.lead_service.exception.NotFoundException;
import pe.albrugroup.lead_service.repository.CampanaRepository;
import pe.albrugroup.lead_service.repository.CuentaPublicitariaRepository;
import pe.albrugroup.lead_service.repository.ProveedorRepository;
import pe.albrugroup.lead_service.service.mapper.CampanaMapper;

import java.time.Instant;
import java.util.List;

@Service @Transactional
@RequiredArgsConstructor
public class CampanaService {

    private final CampanaMapper mapper;
    private final CampanaRepository repository;
    private final CuentaPublicitariaRepository cuentaPublicitariaRepository;
    private final ProveedorRepository proveedorRepository;

    @CacheEvict(value = CacheNames.CAMPANAS, allEntries = true)
    public CampanaResponse registrarCampana(CampanaRequest request) {
        CuentaPublicitaria cuentaPublicitaria = cuentaPublicitariaRepository.findByIdAndActivoTrue(request.getIdCuentaPublicitaria())
                .orElseThrow(() -> new NotFoundException(CuentaPublicitaria.class, request.getIdCuentaPublicitaria()));
        Proveedor proveedor = proveedorRepository.findByIdAndActivoTrue(request.getIdProveedor())
                .orElseThrow(() -> new NotFoundException(Proveedor.class, request.getIdProveedor()));
        Campana campana = mapper.toEntity(request);
        campana.setCuentaPublicitaria(cuentaPublicitaria);
        campana.setProveedor(proveedor);
        campana.setActivo(Boolean.TRUE);
        return mapper.toResponse(repository.save(campana));
    }

    @CacheEvict(value = CacheNames.CAMPANAS, allEntries = true)
    public CampanaResponse actualizarNumeroWhatsappCampana(Long idCampana, CampanaWhatsappRequest request) {
        Campana campana = repository.findByIdAndActivoTrue(idCampana)
                .orElseThrow(() -> new NotFoundException(Campana.class, idCampana));
        mapper.updateNumeroWhatsappCampana(request, campana);
        campana.setUpdatedAt(Instant.now());
        return mapper.toResponse(repository.save(campana));
    }

    @CacheEvict(value = CacheNames.CAMPANAS, allEntries = true)
    public CampanaResponse alternarEstadoCampana(Long idCampana) {
        Campana campana = repository.findById(idCampana)
                .orElseThrow(() -> new NotFoundException(Campana.class, idCampana));

        boolean activar = !Boolean.TRUE.equals(campana.getActivo());
        if (activar) {
            validarDependenciasActivas(campana);
        }

        campana.setActivo(activar);
        campana.setUpdatedAt(Instant.now());
        return mapper.toResponse(repository.save(campana));
    }

    private void validarDependenciasActivas(Campana campana) {
        if (campana.getProveedor() == null || !Boolean.TRUE.equals(campana.getProveedor().getActivo())) {
            throw new BadRequestException("No se puede activar la campana porque el proveedor asociado esta inactivo",
                    campana.getId(),
                    campana.getProveedor() == null ? null : campana.getProveedor().getId());
        }
        if (campana.getCuentaPublicitaria() == null || !Boolean.TRUE.equals(campana.getCuentaPublicitaria().getActivo())) {
            throw new BadRequestException("No se puede activar la campana porque la cuenta publicitaria asociada esta inactiva",
                    campana.getId(),
                    campana.getCuentaPublicitaria() == null ? null : campana.getCuentaPublicitaria().getId());
        }
    }

    @Transactional(readOnly = true)
    @Cacheable(value = CacheNames.CAMPANAS, key = "#activo == null ? 'all' : #activo")
    public List<CampanaResponse> listarCampanas(Boolean activo) {
        return repository.listarPorActivo(activo).stream()
                .map(mapper::toResponse)
                .toList();
    }
}
