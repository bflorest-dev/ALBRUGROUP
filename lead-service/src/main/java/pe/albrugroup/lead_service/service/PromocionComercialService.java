package pe.albrugroup.lead_service.service;

import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.albrugroup.lead_service.configuration.CacheNames;
import pe.albrugroup.lead_service.entity.PromocionComercial;
import pe.albrugroup.lead_service.entity.Proveedor;
import pe.albrugroup.lead_service.entity.Zona;
import pe.albrugroup.lead_service.entity.request.PromocionComercialRequest;
import pe.albrugroup.lead_service.entity.response.PromocionComercialResponse;
import pe.albrugroup.lead_service.exception.DuplicateResourceException;
import pe.albrugroup.lead_service.exception.NotFoundException;
import pe.albrugroup.lead_service.repository.PromocionComercialRepository;
import pe.albrugroup.lead_service.repository.ProveedorRepository;
import pe.albrugroup.lead_service.repository.ZonaRepository;
import pe.albrugroup.lead_service.service.mapper.PromocionComercialMapper;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@Service
@Transactional
@RequiredArgsConstructor
public class PromocionComercialService {

    private final PromocionComercialRepository repository;
    private final ProveedorRepository proveedorRepository;
    private final ZonaRepository zonaRepository;
    private final PromocionComercialMapper mapper;

    @CacheEvict(value = CacheNames.PROMOCIONES_COMERCIALES, allEntries = true)
    public PromocionComercialResponse registrarPromocion(PromocionComercialRequest request) {
        Proveedor proveedor = null;
        if (request.getIdProveedor() != null) {
            proveedor = proveedorRepository.findByIdAndActivoTrue(request.getIdProveedor())
                    .orElseThrow(() -> new NotFoundException(Proveedor.class, request.getIdProveedor()));
        }

        Zona zona = null;
        if (request.getIdZona() != null) {
            zona = zonaRepository.findById(request.getIdZona())
                    .orElseThrow(() -> new NotFoundException(Zona.class, request.getIdZona()));
        }

        validarConsistencia(request, proveedor);

        PromocionComercial promocion = mapper.toEntity(request);
        promocion.setProveedor(proveedor);
        promocion.setZona(zona);
        promocion.setActivo(Boolean.TRUE);
        normalizarVigencias(promocion, LocalDate.now());

        return mapper.toResponse(repository.save(promocion));
    }

    @Transactional(readOnly = true)
    @Cacheable(value = CacheNames.PROMOCIONES_COMERCIALES, key = "(#idProveedor == null ? 'all' : #idProveedor) + ':' + (#interno == null ? 'all' : #interno) + ':' + (#idZona == null ? 'all' : #idZona)")
    public List<PromocionComercialResponse> listarPromociones(Long idProveedor, Boolean interno, Long idZona) {
        LocalDate fechaActual = LocalDate.now();
        return repository.listarActivas(idProveedor, interno, idZona).stream()
                .filter(promocion -> esVigente(promocion, fechaActual))
                .map(mapper::toResponse)
                .toList();
    }

    @CacheEvict(value = CacheNames.PROMOCIONES_COMERCIALES, allEntries = true)
    public PromocionComercialResponse desactivarPromocion(Long idPromocion) {
        PromocionComercial promocion = repository.findById(idPromocion)
                .orElseThrow(() -> new NotFoundException(PromocionComercial.class, idPromocion));

        promocion.setActivo(Boolean.FALSE);
        return mapper.toResponse(repository.save(promocion));
    }

    private void validarConsistencia(PromocionComercialRequest request, Proveedor proveedor) {
        if (Boolean.TRUE.equals(request.getInterno()) && request.getIdProveedor() != null) {
            throw new DuplicateResourceException(
                    "Una promocion interna no debe tener proveedor asociado",
                    Map.of("idProveedor", request.getIdProveedor())
            );
        }
        if (Boolean.FALSE.equals(request.getInterno()) && proveedor == null) {
            throw new DuplicateResourceException(
                    "Una promocion no interna debe indicar un proveedor",
                    null
            );
        }
    }

    private void normalizarVigencias(PromocionComercial promocion, LocalDate fechaActual) {
        if (promocion.getVigenciaDesde() == null) {
            promocion.setVigenciaDesde(fechaActual);
        }
        if (promocion.getVigenciaHasta() != null && promocion.getVigenciaHasta().isBefore(promocion.getVigenciaDesde())) {
            throw new DuplicateResourceException(
                    "La vigenciaHasta no puede ser menor que la vigenciaDesde",
                    Map.of(
                            "vigenciaDesde", promocion.getVigenciaDesde(),
                            "vigenciaHasta", promocion.getVigenciaHasta()
                    )
            );
        }
    }

    private boolean esVigente(PromocionComercial promocion, LocalDate fechaActual) {
        LocalDate vigenciaDesde = promocion.getVigenciaDesde();
        LocalDate vigenciaHasta = promocion.getVigenciaHasta();

        if (vigenciaDesde == null) {
            return vigenciaHasta == null || !vigenciaHasta.isBefore(fechaActual);
        }
        return !vigenciaDesde.isAfter(fechaActual)
                && (vigenciaHasta == null || !vigenciaHasta.isBefore(fechaActual));
    }
}
