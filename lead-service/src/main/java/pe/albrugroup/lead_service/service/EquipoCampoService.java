package pe.albrugroup.lead_service.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.albrugroup.lead_service.entity.EquipoProveedor;
import pe.albrugroup.lead_service.entity.EquipoCampo;
import pe.albrugroup.lead_service.entity.ProveedorCampo;
import pe.albrugroup.lead_service.entity.enums.CampoConfigurable;
import pe.albrugroup.lead_service.entity.response.CampoConfigResponse;
import pe.albrugroup.lead_service.repository.EquipoCampoRepository;
import pe.albrugroup.lead_service.repository.EquipoProveedorRepository;
import pe.albrugroup.lead_service.repository.ProveedorCampoRepository;

import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * Resuelve la configuración de campos de captura de un equipo sobre el catálogo
 * {@link CampoConfigurable}. Modelo de inclusión: un campo sin fila guardada se considera OCULTO
 * (y opcional), de modo que un equipo nuevo sin configurar solo muestra los campos núcleo hasta que
 * el admin habilite los demás. Así, agregar un campo al catálogo no lo activa silenciosamente en
 * equipos ya existentes.
 */
@Service
@RequiredArgsConstructor
public class EquipoCampoService {

    private final EquipoCampoRepository equipoCampoRepository;
    private final EquipoProveedorRepository equipoProveedorRepository;
    private final EquipoProveedorService equipoProveedorService;
    private final ProveedorCampoRepository proveedorCampoRepository;

    /** Config completa del equipo: una entrada por cada campo del catálogo (con o sin fila guardada). */
    @Transactional(readOnly = true)
    public List<CampoConfigResponse> resolverConfig(Long idEquipo) {
        Map<CampoConfigurable, EquipoCampo> guardados = idEquipo == null
                ? Map.of()
                : equipoCampoRepository.findByIdEquipo(idEquipo).stream()
                        .collect(Collectors.toMap(EquipoCampo::getCampo, Function.identity(), (a, b) -> a));

        return resolverConfigEquipo(guardados);
    }

    private List<CampoConfigResponse> resolverConfigEquipo(Map<CampoConfigurable, EquipoCampo> guardados) {
        return Arrays.stream(CampoConfigurable.values())
                .map(campo -> {
                    EquipoCampo guardado = guardados.get(campo);
                    boolean visible = guardado != null && guardado.isVisible();
                    boolean requerido = guardado != null && guardado.isRequerido();
                    return CampoConfigResponse.builder()
                            .campo(campo)
                            .tab(campo.getTab())
                            .descripcion(campo.getDescripcion())
                            .visible(visible)
                            .requerido(requerido)
                            .build();
                })
                .toList();
    }

    private List<CampoConfigResponse> resolverConfigProveedor(Map<CampoConfigurable, ProveedorCampo> guardados) {
        return Arrays.stream(CampoConfigurable.values())
                .map(campo -> {
                    ProveedorCampo guardado = guardados.get(campo);
                    boolean visible = guardado != null && guardado.isVisible();
                    boolean requerido = guardado != null && guardado.isRequerido();
                    return CampoConfigResponse.builder()
                            .campo(campo)
                            .tab(campo.getTab())
                            .descripcion(campo.getDescripcion())
                            .visible(visible)
                            .requerido(requerido)
                            .build();
                })
                .toList();
    }

    /**
     * Config de campos que corresponde al proveedor ofrecido. Para asesores multi-equipo, el plan
     * elegido define el proveedor y el proveedor define el equipo operativo cuyas reglas de captura
     * aplican al cierre de PREVENTA.
     */
    @Transactional(readOnly = true)
    public List<CampoConfigResponse> resolverConfigPorProveedorVisible(Long idProveedor) {
        Set<Long> visibles = equipoProveedorService.proveedorIdsVisibles();
        if (idProveedor == null || (visibles != null && !visibles.contains(idProveedor))) {
            return resolverConfig(null);
        }
        List<ProveedorCampo> proveedorCampos = proveedorCampoRepository.findByProveedorId(idProveedor);
        if (!proveedorCampos.isEmpty()) {
            Map<CampoConfigurable, ProveedorCampo> guardados = proveedorCampos.stream()
                    .collect(Collectors.toMap(ProveedorCampo::getCampo, Function.identity(), (a, b) -> a));
            return resolverConfigProveedor(guardados);
        }
        return equipoProveedorRepository.findFirstByProveedorId(idProveedor)
                .map(EquipoProveedor::getIdEquipo)
                .map(this::resolverConfig)
                .orElseGet(() -> resolverConfig(null));
    }

    /**
     * Config del proveedor real de un lead ya autorizado. No valida el scope del usuario porque la
     * visibilidad del lead se resuelve antes de construir el detalle; aquí solo se decide qué campos
     * aplican al plan cerrado del lead.
     */
    @Transactional(readOnly = true)
    public List<CampoConfigResponse> resolverConfigPorProveedor(Long idProveedor) {
        if (idProveedor == null) {
            return resolverConfig(null);
        }
        List<ProveedorCampo> proveedorCampos = proveedorCampoRepository.findByProveedorId(idProveedor);
        if (!proveedorCampos.isEmpty()) {
            Map<CampoConfigurable, ProveedorCampo> guardados = proveedorCampos.stream()
                    .collect(Collectors.toMap(ProveedorCampo::getCampo, Function.identity(), (a, b) -> a));
            return resolverConfigProveedor(guardados);
        }
        return equipoProveedorRepository.findFirstByProveedorId(idProveedor)
                .map(EquipoProveedor::getIdEquipo)
                .map(this::resolverConfig)
                .orElseGet(() -> resolverConfig(null));
    }
}
