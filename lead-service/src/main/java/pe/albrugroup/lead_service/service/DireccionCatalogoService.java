package pe.albrugroup.lead_service.service;

import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import pe.albrugroup.lead_service.configuration.CacheNames;
import pe.albrugroup.lead_service.entity.enums.TipoUrbanizacion;
import pe.albrugroup.lead_service.entity.response.TipoDomicilioResponse;
import pe.albrugroup.lead_service.repository.TipoDomicilioRepository;

import java.util.Arrays;
import java.util.List;

@Service
@RequiredArgsConstructor
public class DireccionCatalogoService {

    private final TipoDomicilioRepository tipoDomicilioRepository;

    @Cacheable(value = CacheNames.TIPOS_DOMICILIO, key = "#idProveedor")
    public List<TipoDomicilioResponse> listarTiposDomicilio(Long idProveedor) {
        return tipoDomicilioRepository.findByProveedorIdAndActivoTrue(idProveedor).stream()
                .map(td -> TipoDomicilioResponse.builder()
                        .id(td.getId())
                        .nombre(td.getNombre())
                        .esVertical(td.isEsVertical())
                        .build())
                .toList();
    }

    @Cacheable(value = CacheNames.TIPOS_URBANIZACION)
    public List<String> listarTiposUrbanizacion() {
        return Arrays.stream(TipoUrbanizacion.values())
                .map(TipoUrbanizacion::name)
                .toList();
    }
}
