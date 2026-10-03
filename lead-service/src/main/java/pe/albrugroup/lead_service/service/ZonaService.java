package pe.albrugroup.lead_service.service;

import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.albrugroup.lead_service.configuration.CacheNames;
import pe.albrugroup.lead_service.entity.Departamento;
import pe.albrugroup.lead_service.entity.Direccion;
import pe.albrugroup.lead_service.entity.Distrito;
import pe.albrugroup.lead_service.entity.Proveedor;
import pe.albrugroup.lead_service.entity.Provincia;
import pe.albrugroup.lead_service.entity.Zona;
import pe.albrugroup.lead_service.entity.ZonaRegla;
import pe.albrugroup.lead_service.entity.enums.CriterioZona;
import pe.albrugroup.lead_service.entity.enums.NivelGeografico;
import pe.albrugroup.lead_service.entity.request.ZonaReglaRequest;
import pe.albrugroup.lead_service.entity.request.ZonaRequest;
import pe.albrugroup.lead_service.entity.response.ZonaReglaResponse;
import pe.albrugroup.lead_service.entity.response.ZonaResponse;
import pe.albrugroup.lead_service.exception.NotFoundException;
import pe.albrugroup.lead_service.exception.BadRequestException;
import pe.albrugroup.lead_service.repository.DepartamentoRepository;
import pe.albrugroup.lead_service.repository.DistritoRepository;
import pe.albrugroup.lead_service.repository.ProveedorRepository;
import pe.albrugroup.lead_service.repository.ProvinciaRepository;
import pe.albrugroup.lead_service.repository.ZonaReglaRepository;
import pe.albrugroup.lead_service.repository.ZonaRepository;
import pe.albrugroup.lead_service.service.mapper.ZonaMapper;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
@Transactional
@RequiredArgsConstructor
public class ZonaService {

    private final ZonaRepository zonaRepository;
    private final ZonaReglaRepository zonaReglaRepository;
    private final ProveedorRepository proveedorRepository;
    private final DepartamentoRepository departamentoRepository;
    private final ProvinciaRepository provinciaRepository;
    private final DistritoRepository distritoRepository;
    private final ZonaMapper mapper;

    @CacheEvict(value = CacheNames.ZONAS, allEntries = true)
    public ZonaResponse registrarZona(ZonaRequest request) {
        validarReglas(request.getReglas());

        Proveedor proveedor = proveedorRepository.findById(request.getIdProveedor())
                .orElseThrow(() -> new NotFoundException(Proveedor.class, request.getIdProveedor()));

        Zona zona = mapper.toEntity(request);
        zona.setActivo(Boolean.TRUE);
        zona.setProveedor(proveedor);
        Zona zonaGuardada = zonaRepository.save(zona);

        List<ZonaRegla> reglas = request.getReglas().stream()
                .map(reglaRequest -> crearRegla(zonaGuardada, reglaRequest))
                .toList();

        List<ZonaRegla> reglasGuardadas = zonaReglaRepository.saveAll(reglas);
        return construirRespuesta(zonaGuardada, reglasGuardadas);
    }

    @Transactional(readOnly = true)
    @Cacheable(value = CacheNames.ZONAS, key = "(#idProveedor == null ? 'all' : #idProveedor) + '_' + (#activo == null ? 'all' : #activo)")
    public List<ZonaResponse> listarZonas(Long idProveedor, Boolean activo) {
        List<Zona> zonas = zonaRepository.listarPorProveedorYActivo(idProveedor, activo);
        if (zonas.isEmpty()) {
            return List.of();
        }

        List<Long> zonaIds = zonas.stream().map(Zona::getId).toList();
        List<ZonaRegla> reglas = zonaReglaRepository.findByZonaIdIn(zonaIds);
        Map<Long, List<ZonaRegla>> reglasPorZona = agruparReglas(reglas);

        return zonas.stream()
                .map(zona -> construirRespuesta(zona, reglasPorZona.getOrDefault(zona.getId(), List.of())))
                .toList();
    }

    @CacheEvict(value = CacheNames.ZONAS, allEntries = true)
    public ZonaResponse alternarEstadoZona(Long idZona) {
        Zona zona = zonaRepository.findById(idZona)
                .orElseThrow(() -> new NotFoundException(Zona.class, idZona));

        zona.setActivo(!Boolean.TRUE.equals(zona.getActivo()));
        Zona zonaActualizada = zonaRepository.save(zona);
        List<ZonaRegla> reglas = zonaReglaRepository.findByZonaId(zonaActualizada.getId());
        return construirRespuesta(zonaActualizada, reglas);
    }

    @CacheEvict(value = CacheNames.ZONAS, allEntries = true)
    public ZonaResponse actualizarZona(Long idZona, ZonaRequest request) {
        validarReglas(request.getReglas());

        Zona zona = zonaRepository.findById(idZona)
                .orElseThrow(() -> new NotFoundException(Zona.class, idZona));
        Proveedor proveedor = proveedorRepository.findById(request.getIdProveedor())
                .orElseThrow(() -> new NotFoundException(Proveedor.class, request.getIdProveedor()));

        mapper.updateDatosZona(request, zona);
        zona.setProveedor(proveedor);
        Zona zonaActualizada = zonaRepository.save(zona);

        zonaReglaRepository.deleteAllByZonaId(zonaActualizada.getId());
        zonaReglaRepository.flush();

        List<ZonaRegla> reglas = request.getReglas().stream()
                .map(reglaRequest -> crearRegla(zonaActualizada, reglaRequest))
                .toList();

        List<ZonaRegla> reglasGuardadas = zonaReglaRepository.saveAll(reglas);
        return construirRespuesta(zonaActualizada, reglasGuardadas);
    }

    @Transactional(readOnly = true)
    public Zona resolverZonaGeografica(Proveedor proveedor, Direccion direccion) {
        if (proveedor == null || direccion == null
                || direccion.getUbigeoDomicilio() == null
                || direccion.getUbigeoDomicilio().isBlank()) {
            return null;
        }
        Distrito distrito = distritoRepository.findByCodigo(direccion.getUbigeoDomicilio()).orElse(null);
        if (distrito == null) return null;

        List<Zona> zonasGeo = zonaRepository
                .findByProveedorIdAndEsGeograficaTrueAndActivoTrue(proveedor.getId());

        for (Zona zona : zonasGeo) {
            List<ZonaRegla> reglas = zonaReglaRepository.findByZonaId(zona.getId());
            if (coincideConReglas(reglas, distrito)) {
                return zona;
            }
        }
        return null;
    }

    private boolean coincideConReglas(List<ZonaRegla> reglas, Distrito distrito) {
        boolean tieneInclusiones = reglas.stream()
                .anyMatch(r -> r.getCriterio() == CriterioZona.INCLUIR);
        boolean coincideExclusion = reglas.stream()
                .anyMatch(r -> r.getCriterio() == CriterioZona.EXCLUIR && coincideRegla(r, distrito));
        if (coincideExclusion) return false;

        if (!tieneInclusiones) return true;
        return reglas.stream()
                .anyMatch(r -> r.getCriterio() == CriterioZona.INCLUIR && coincideRegla(r, distrito));
    }

    private boolean coincideRegla(ZonaRegla regla, Distrito distrito) {
        return switch (regla.getNivelGeografico()) {
            case DEPARTAMENTO -> distrito.getDepartamento() != null
                    && regla.getGeoId().equals(distrito.getDepartamento().getId());
            case PROVINCIA -> distrito.getProvincia() != null
                    && regla.getGeoId().equals(distrito.getProvincia().getId());
            case DISTRITO -> regla.getGeoId().equals(distrito.getId());
        };
    }

    private ZonaRegla crearRegla(Zona zona, ZonaReglaRequest reglaRequest) {
        validarGeoExiste(reglaRequest.getNivelGeografico(), reglaRequest.getGeoId());

        ZonaRegla regla = mapper.toEntity(reglaRequest);
        regla.setZona(zona);
        return regla;
    }

    private void validarReglas(List<ZonaReglaRequest> reglas) {
        Set<String> firma = new HashSet<>();
        for (ZonaReglaRequest regla : reglas) {
            String key = regla.getNivelGeografico() + "|" + regla.getGeoId() + "|" + regla.getCriterio();
            if (!firma.add(key)) {
                throw new BadRequestException(
                        "La zona contiene reglas duplicadas",
                        null,
                        key
                );
            }
        }
    }

    private void validarGeoExiste(NivelGeografico nivel, Long geoId) {
        switch (nivel) {
            case DEPARTAMENTO -> departamentoRepository.findById(geoId)
                    .orElseThrow(() -> new NotFoundException(Departamento.class, geoId));
            case PROVINCIA -> provinciaRepository.findById(geoId)
                    .orElseThrow(() -> new NotFoundException(Provincia.class, geoId));
            case DISTRITO -> distritoRepository.findById(geoId)
                    .orElseThrow(() -> new NotFoundException(Distrito.class, geoId));
        }
    }

    private Map<Long, List<ZonaRegla>> agruparReglas(List<ZonaRegla> reglas) {
        Map<Long, List<ZonaRegla>> reglasPorZona = new HashMap<>();
        for (ZonaRegla regla : reglas) {
            Long zonaId = regla.getZona().getId();
            reglasPorZona.computeIfAbsent(zonaId, id -> new ArrayList<>()).add(regla);
        }
        return reglasPorZona;
    }

    private ZonaResponse construirRespuesta(Zona zona, List<ZonaRegla> reglas) {
        Map<String, String> labels = construirLabelsUbigeo(reglas);
        return mapper.toResponse(zona, reglas.stream().map(regla -> {
            ZonaReglaResponse response = mapper.toResponse(regla);
            response.setGeoNombre(labels.get(ubigeoKey(regla.getNivelGeografico(), regla.getGeoId())));
            return response;
        }).toList());
    }

    private Map<String, String> construirLabelsUbigeo(List<ZonaRegla> reglas) {
        Set<Long> departamentoIds = new HashSet<>();
        Set<Long> provinciaIds = new HashSet<>();
        Set<Long> distritoIds = new HashSet<>();

        for (ZonaRegla regla : reglas) {
            switch (regla.getNivelGeografico()) {
                case DEPARTAMENTO -> departamentoIds.add(regla.getGeoId());
                case PROVINCIA -> provinciaIds.add(regla.getGeoId());
                case DISTRITO -> distritoIds.add(regla.getGeoId());
            }
        }

        Map<String, String> labels = new HashMap<>();
        departamentoRepository.findAllById(departamentoIds)
                .forEach(item -> labels.put(ubigeoKey(NivelGeografico.DEPARTAMENTO, item.getId()), item.getNombre()));
        provinciaRepository.findAllById(provinciaIds)
                .forEach(item -> labels.put(ubigeoKey(NivelGeografico.PROVINCIA, item.getId()), item.getNombre()));
        distritoRepository.findAllById(distritoIds)
                .forEach(item -> labels.put(ubigeoKey(NivelGeografico.DISTRITO, item.getId()), item.getNombre()));
        return labels;
    }

    private String ubigeoKey(NivelGeografico nivel, Long geoId) {
        return nivel + ":" + geoId;
    }
}
