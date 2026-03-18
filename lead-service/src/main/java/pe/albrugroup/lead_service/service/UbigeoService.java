package pe.albrugroup.lead_service.service;

import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.albrugroup.lead_service.configuration.CacheNames;
import pe.albrugroup.lead_service.entity.Departamento;
import pe.albrugroup.lead_service.entity.Provincia;
import pe.albrugroup.lead_service.entity.response.DepartamentoResponse;
import pe.albrugroup.lead_service.entity.response.DistritoResponse;
import pe.albrugroup.lead_service.entity.response.ProvinciaResponse;
import pe.albrugroup.lead_service.exception.NotFoundException;
import pe.albrugroup.lead_service.repository.DepartamentoRepository;
import pe.albrugroup.lead_service.repository.DistritoRepository;
import pe.albrugroup.lead_service.repository.ProvinciaRepository;
import pe.albrugroup.lead_service.service.mapper.UbigeoMapper;

import java.util.List;

@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class UbigeoService {

    private final DepartamentoRepository departamentoRepository;
    private final ProvinciaRepository provinciaRepository;
    private final DistritoRepository distritoRepository;
    private final UbigeoMapper mapper;

    @Cacheable(value = CacheNames.UBIGEO, key = "'departamentos'")
    public List<DepartamentoResponse> listarDepartamentos() {
        return mapper.toDepartamentoResponse(departamentoRepository.findAllByOrderByNombreAsc());
    }

    @Cacheable(value = CacheNames.UBIGEO, key = "'provincias:' + #idDepartamento")
    public List<ProvinciaResponse> listarProvincias(Long idDepartamento) {
        Departamento departamento = departamentoRepository.findById(idDepartamento)
                .orElseThrow(() -> new NotFoundException(Departamento.class, idDepartamento));

        List<Provincia> provincias = provinciaRepository.findByDepartamentoIdOrderByNombreAsc(departamento.getId());
        return mapper.toProvinciaResponse(provincias);
    }

    @Cacheable(value = CacheNames.UBIGEO, key = "'distritos:' + #idProvincia")
    public List<DistritoResponse> listarDistritos(Long idProvincia) {
        Provincia provincia = provinciaRepository.findById(idProvincia)
                .orElseThrow(() -> new NotFoundException(Provincia.class, idProvincia));

        return mapper.toDistritoResponse(distritoRepository.findByProvinciaIdOrderByNombreAsc(provincia.getId()));
    }
}
