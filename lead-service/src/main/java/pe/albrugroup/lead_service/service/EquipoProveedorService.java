package pe.albrugroup.lead_service.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.albrugroup.lead_service.configuration.CurrentUser;
import pe.albrugroup.lead_service.entity.EquipoProveedor;
import pe.albrugroup.lead_service.entity.Proveedor;
import pe.albrugroup.lead_service.entity.response.ProveedorResponse;
import pe.albrugroup.lead_service.exception.BadRequestException;
import pe.albrugroup.lead_service.repository.EquipoCampoRepository;
import pe.albrugroup.lead_service.repository.EquipoProveedorRepository;
import pe.albrugroup.lead_service.repository.LeadRepository;
import pe.albrugroup.lead_service.repository.ProveedorRepository;
import pe.albrugroup.lead_service.service.mapper.ProveedorMapper;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service @Transactional
@RequiredArgsConstructor
public class EquipoProveedorService {

    private final EquipoProveedorRepository equipoProveedorRepository;
    private final EquipoCampoRepository equipoCampoRepository;
    private final ProveedorRepository proveedorRepository;
    private final ProveedorMapper proveedorMapper;
    private final LeadRepository leadRepository;
    private final CurrentUser currentUser;

    /** Reemplaza los proveedores asignados a un equipo. */
    public List<ProveedorResponse> asignarProveedores(
            Long idEquipo,
            Set<Long> proveedorIds,
            Long idProveedorFallbackLeadSinCampana
    ) {
        Set<Long> ids = proveedorIds == null ? Set.of() : proveedorIds;
        validarFallback(ids, idProveedorFallbackLeadSinCampana);

        List<Proveedor> proveedores = ids.isEmpty()
                ? List.of()
                : proveedorRepository.findAllById(ids);
        if (proveedores.size() != ids.size()) {
            throw new BadRequestException("Uno o más proveedores no existen");
        }

        // Reemplaza solo el set de este equipo. Un mismo proveedor puede estar asignado a varios
        // equipos para que cada equipo vea sus campañas, planes y promociones.
        equipoProveedorRepository.deleteByIdEquipo(idEquipo);
        equipoProveedorRepository.flush();
        proveedores.forEach(proveedor -> equipoProveedorRepository.save(
                EquipoProveedor.builder()
                        .idEquipo(idEquipo)
                        .proveedor(proveedor)
                        .fallbackLeadSinCampana(proveedor.getId().equals(idProveedorFallbackLeadSinCampana))
                        .build()));

        return equipoProveedorRepository.findByIdEquipo(idEquipo).stream()
                .map(this::mapearProveedorEquipo)
                .toList();
    }

    /** Limpia los datos de lead-service asociados a un equipo (al eliminarlo en auth). */
    public void eliminarDatosDeEquipo(Long idEquipo) {
        equipoProveedorRepository.deleteByIdEquipo(idEquipo);
        equipoCampoRepository.deleteByIdEquipo(idEquipo);
        leadRepository.desvincularEquipo(idEquipo);
    }

    @Transactional(readOnly = true)
    public List<ProveedorResponse> listarProveedoresDeEquipo(Long idEquipo) {
        return equipoProveedorRepository.findByIdEquipo(idEquipo).stream()
                .map(this::mapearProveedorEquipo)
                .toList();
    }

    private void validarFallback(Set<Long> proveedorIds, Long idProveedorFallbackLeadSinCampana) {
        if (proveedorIds.isEmpty()) {
            if (idProveedorFallbackLeadSinCampana != null) {
                throw new BadRequestException("El fallback debe pertenecer a los proveedores del equipo");
            }
            return;
        }
        if (idProveedorFallbackLeadSinCampana == null) {
            throw new BadRequestException("Elige el proveedor fallback para leads sin campana");
        }
        if (!proveedorIds.contains(idProveedorFallbackLeadSinCampana)) {
            throw new BadRequestException("El proveedor fallback debe estar asignado al equipo");
        }
    }

    private ProveedorResponse mapearProveedorEquipo(EquipoProveedor equipoProveedor) {
        ProveedorResponse response = proveedorMapper.toResponse(equipoProveedor.getProveedor());
        response.setFallbackLeadSinCampana(equipoProveedor.isFallbackLeadSinCampana());
        return response;
    }

    /**
     * Ids de proveedores visibles para el usuario actual.
     * - Visibilidad global (permiso) → null (sin filtro: todos).
     * - Con equipo(s) → proveedores mapeados a esos equipos.
     * - Sin equipo y sin permiso global → conjunto vacío (fail-closed).
     */
    @Transactional(readOnly = true)
    public Set<Long> proveedorIdsVisibles() {
        if (currentUser.tieneVisibilidadGlobalEquipos()) {
            return null;
        }
        List<Long> equipos = currentUser.equipos();
        if (equipos == null || equipos.isEmpty()) {
            return Set.of();
        }
        return equipoProveedorRepository.findByIdEquipoIn(equipos).stream()
                .map(ep -> ep.getProveedor().getId())
                .collect(Collectors.toSet());
    }
}
