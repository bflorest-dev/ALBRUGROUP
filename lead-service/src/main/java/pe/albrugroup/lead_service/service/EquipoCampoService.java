package pe.albrugroup.lead_service.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.albrugroup.lead_service.entity.EquipoCampo;
import pe.albrugroup.lead_service.entity.enums.CampoConfigurable;
import pe.albrugroup.lead_service.entity.response.CampoConfigResponse;
import pe.albrugroup.lead_service.repository.EquipoCampoRepository;

import java.util.Arrays;
import java.util.List;
import java.util.Map;
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

    /** Config completa del equipo: una entrada por cada campo del catálogo (con o sin fila guardada). */
    @Transactional(readOnly = true)
    public List<CampoConfigResponse> resolverConfig(Long idEquipo) {
        Map<CampoConfigurable, EquipoCampo> guardados = idEquipo == null
                ? Map.of()
                : equipoCampoRepository.findByIdEquipo(idEquipo).stream()
                        .collect(Collectors.toMap(EquipoCampo::getCampo, Function.identity(), (a, b) -> a));

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
}
