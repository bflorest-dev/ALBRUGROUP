package pe.albrugroup.lead_service.service;

import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.albrugroup.lead_service.configuration.CacheNames;
import pe.albrugroup.lead_service.entity.response.OrigenResponse;
import pe.albrugroup.lead_service.repository.OrigenRepository;

import java.util.List;

@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class OrigenService {

    private final OrigenRepository origenRepository;

    @Cacheable(value = CacheNames.ORIGENES, key = "'activos'")
    public List<OrigenResponse> listarActivos() {
        return origenRepository.findByActivoTrueOrderByOrdenAsc().stream()
                .map(o -> new OrigenResponse(o.getId(), o.getCodigo(), o.getNombre(), o.isEsOrganico(), o.isEsCampana()))
                .toList();
    }
}
