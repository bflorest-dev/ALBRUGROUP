package pe.albrugroup.lead_service.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.albrugroup.lead_service.configuration.CurrentUser;
import pe.albrugroup.lead_service.entity.EquipoProveedor;
import pe.albrugroup.lead_service.entity.Proveedor;
import pe.albrugroup.lead_service.entity.response.ProveedorResponse;
import pe.albrugroup.lead_service.exception.BadRequestException;
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
    private final ProveedorRepository proveedorRepository;
    private final ProveedorMapper proveedorMapper;
    private final LeadRepository leadRepository;
    private final CurrentUser currentUser;

    /** Reemplaza los proveedores asignados a un equipo. */
    public List<ProveedorResponse> asignarProveedores(Long idEquipo, Set<Long> proveedorIds) {
        Set<Long> ids = proveedorIds == null ? Set.of() : proveedorIds;

        List<Proveedor> proveedores = ids.isEmpty()
                ? List.of()
                : proveedorRepository.findAllById(ids);
        if (proveedores.size() != ids.size()) {
            throw new BadRequestException("Uno o más proveedores no existen");
        }

        equipoProveedorRepository.deleteByIdEquipo(idEquipo);
        proveedores.forEach(proveedor -> equipoProveedorRepository.save(
                EquipoProveedor.builder()
                        .idEquipo(idEquipo)
                        .proveedor(proveedor)
                        .build()));

        return proveedores.stream().map(proveedorMapper::toResponse).toList();
    }

    /**
     * Backfill de `id_equipo` en leads existentes según el mapping equipo_proveedor actual
     * (campaña → proveedor → equipo). Idempotente: solo toca leads sin equipo. Se ejecuta
     * después de asignar proveedores a los equipos. Retorna la cantidad de leads actualizados.
     */
    public int backfillIdEquipoLeads() {
        return leadRepository.backfillIdEquipoDesdeMapping();
    }

    @Transactional(readOnly = true)
    public List<ProveedorResponse> listarProveedoresDeEquipo(Long idEquipo) {
        return equipoProveedorRepository.findByIdEquipo(idEquipo).stream()
                .map(ep -> proveedorMapper.toResponse(ep.getProveedor()))
                .toList();
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
