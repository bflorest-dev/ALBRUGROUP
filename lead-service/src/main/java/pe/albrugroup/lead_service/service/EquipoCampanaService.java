package pe.albrugroup.lead_service.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.albrugroup.lead_service.configuration.CurrentUser;
import pe.albrugroup.lead_service.entity.Campana;
import pe.albrugroup.lead_service.entity.EquipoCampana;
import pe.albrugroup.lead_service.entity.EquipoProveedor;
import pe.albrugroup.lead_service.entity.response.EquipoCampanaResponse;
import pe.albrugroup.lead_service.exception.BadRequestException;
import pe.albrugroup.lead_service.exception.ForbiddenException;
import pe.albrugroup.lead_service.repository.CampanaRepository;
import pe.albrugroup.lead_service.repository.EquipoCampanaRepository;
import pe.albrugroup.lead_service.repository.EquipoProveedorRepository;

import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

/** Gestiona el límite explícito entre proveedores habilitados y campañas operativas por equipo. */
@Service
@Transactional
@RequiredArgsConstructor
public class EquipoCampanaService {

    private final EquipoCampanaRepository equipoCampanaRepository;
    private final EquipoProveedorRepository equipoProveedorRepository;
    private final CampanaRepository campanaRepository;
    private final CurrentUser currentUser;

    /**
     * Campañas de los proveedores habilitados para el equipo. El id de equipo actual permite que
     * el cliente informe y confirme un traslado desde otro equipo administrable.
     */
    @Transactional(readOnly = true)
    public List<EquipoCampanaResponse> listarConfiguracion(Long idEquipo) {
        validarEquipoAdministrable(idEquipo);
        Set<Long> proveedores = proveedorIdsDelEquipo(idEquipo);
        if (proveedores.isEmpty()) {
            return List.of();
        }

        List<Campana> campanas = campanaRepository.listarActivasPorProveedorIds(proveedores);
        Map<Long, Long> equipoPorCampana = equipoCampanaRepository.findByCampanaIdIn(
                        campanas.stream().map(Campana::getId).toList())
                .stream()
                .collect(Collectors.toMap(
                        relacion -> relacion.getCampana().getId(),
                        EquipoCampana::getIdEquipo,
                        (primero, ignorado) -> primero));

        return campanas.stream()
                .map(campana -> toResponse(campana, equipoPorCampana.get(campana.getId())))
                .sorted(Comparator.comparing(EquipoCampanaResponse::getNombre,
                        Comparator.nullsLast(String.CASE_INSENSITIVE_ORDER)))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<EquipoCampanaResponse> listarAsignadas(Long idEquipo) {
        validarEquipoAdministrable(idEquipo);
        return equipoCampanaRepository.findByIdEquipo(idEquipo).stream()
                .map(relacion -> toResponse(relacion.getCampana(), idEquipo))
                .sorted(Comparator.comparing(EquipoCampanaResponse::getNombre,
                        Comparator.nullsLast(String.CASE_INSENSITIVE_ORDER)))
                .toList();
    }

    /**
     * Reemplaza el conjunto del equipo. Las campañas de otro equipo solo se trasladan si el
     * solicitante también administra ese equipo de origen. Las demás campañas del origen quedan
     * intactas: se eliminan exclusivamente los vínculos que se trasladan.
     */
    public List<EquipoCampanaResponse> asignarCampanas(Long idEquipo, Set<Long> campanaIds) {
        validarEquipoAdministrable(idEquipo);
        Set<Long> idsSolicitados = campanaIds == null ? Set.of() : new HashSet<>(campanaIds);
        if (idsSolicitados.stream().anyMatch(id -> id == null || id <= 0)) {
            throw new BadRequestException("Una o más campañas no son válidas");
        }

        List<Campana> campanas = idsSolicitados.isEmpty()
                ? List.of()
                : campanaRepository.findAllById(idsSolicitados);
        if (campanas.size() != idsSolicitados.size()) {
            throw new BadRequestException("Una o más campañas no existen");
        }

        Set<Long> proveedoresEquipo = proveedorIdsDelEquipo(idEquipo);
        for (Campana campana : campanas) {
            Long idProveedor = campana.getProveedor() == null ? null : campana.getProveedor().getId();
            if (idProveedor == null || !proveedoresEquipo.contains(idProveedor)) {
                throw new BadRequestException("La campaña " + campana.getId()
                        + " no pertenece a un proveedor configurado para este equipo");
            }
        }

        List<EquipoCampana> asignacionesSolicitadas = idsSolicitados.isEmpty()
                ? List.of()
                : equipoCampanaRepository.findByCampanaIdIn(idsSolicitados);
        for (EquipoCampana relacion : asignacionesSolicitadas) {
            if (!relacion.getIdEquipo().equals(idEquipo)) {
                validarEquipoAdministrable(relacion.getIdEquipo());
            }
        }

        // Al reemplazar el destino se eliminan todas sus asignaciones; para cada origen solo se
        // borra la campaña que el usuario está trasladando, nunca el conjunto completo de origen.
        equipoCampanaRepository.deleteByIdEquipo(idEquipo);
        equipoCampanaRepository.deleteAllByIdInBatch(asignacionesSolicitadas.stream()
                .filter(relacion -> !relacion.getIdEquipo().equals(idEquipo))
                .map(EquipoCampana::getId)
                .toList());
        equipoCampanaRepository.flush();

        campanas.forEach(campana -> equipoCampanaRepository.save(EquipoCampana.builder()
                .idEquipo(idEquipo)
                .campana(campana)
                .build()));

        return equipoCampanaRepository.findByIdEquipo(idEquipo).stream()
                .map(relacion -> toResponse(relacion.getCampana(), idEquipo))
                .sorted(Comparator.comparing(EquipoCampanaResponse::getNombre,
                        Comparator.nullsLast(String.CASE_INSENSITIVE_ORDER)))
                .toList();
    }

    @Transactional(readOnly = true)
    public Set<Long> campanaIdsVisibles() {
        return campanaIdsVisibles(null);
    }

    /**
     * Devuelve las campañas operativas del ámbito solicitado. Para un usuario de equipos el
     * ámbito solo puede ser uno de sus equipos; sin equipo solicitado conserva la unión de
     * todos sus equipos (uso administrativo y compatibilidad con consumidores existentes).
     */
    @Transactional(readOnly = true)
    public Set<Long> campanaIdsVisibles(Long idEquipoSolicitado) {
        if (currentUser.tieneVisibilidadGlobalEquipos()) {
            return idEquipoSolicitado == null
                    ? null
                    : equipoCampanaRepository.findByIdEquipo(idEquipoSolicitado).stream()
                    .map(relacion -> relacion.getCampana().getId())
                    .collect(Collectors.toSet());
        }
        List<Long> equipos = currentUser.equipos();
        if (equipos == null || equipos.isEmpty()) {
            return Set.of();
        }
        if (idEquipoSolicitado != null && !equipos.contains(idEquipoSolicitado)) {
            throw new ForbiddenException("No tienes acceso al equipo seleccionado");
        }
        List<EquipoCampana> asignaciones = idEquipoSolicitado == null
                ? equipoCampanaRepository.findByIdEquipoIn(equipos)
                : equipoCampanaRepository.findByIdEquipo(idEquipoSolicitado);
        return asignaciones.stream()
                .map(relacion -> relacion.getCampana().getId())
                .collect(Collectors.toSet());
    }

    @Transactional(readOnly = true)
    public Long resolverEquipoPorCampana(Long idCampana) {
        return equipoCampanaRepository.findByCampanaId(idCampana)
                .map(EquipoCampana::getIdEquipo)
                .orElse(null);
    }

    @Transactional(readOnly = true)
    public boolean perteneceCampanaAEquipo(Long idCampana, Long idEquipo) {
        return idCampana != null && idEquipo != null
                && equipoCampanaRepository.existsByIdEquipoAndCampanaId(idEquipo, idCampana);
    }

    /** Evita que al editar proveedores queden campañas asignadas sin proveedor permitido. */
    @Transactional(readOnly = true)
    public boolean hayCampanasDeProveedorNoPermitido(Long idEquipo, Set<Long> proveedorIds) {
        return equipoCampanaRepository.findByIdEquipo(idEquipo).stream()
                .map(EquipoCampana::getCampana)
                .map(Campana::getProveedor)
                .anyMatch(proveedor -> proveedor == null || !proveedorIds.contains(proveedor.getId()));
    }

    public void eliminarDatosDeEquipo(Long idEquipo) {
        equipoCampanaRepository.deleteByIdEquipo(idEquipo);
    }

    private Set<Long> proveedorIdsDelEquipo(Long idEquipo) {
        return equipoProveedorRepository.findByIdEquipo(idEquipo).stream()
                .map(EquipoProveedor::getProveedor)
                .filter(proveedor -> proveedor != null && proveedor.getId() != null)
                .map(proveedor -> proveedor.getId())
                .collect(Collectors.toSet());
    }

    private void validarEquipoAdministrable(Long idEquipo) {
        if (idEquipo == null || idEquipo <= 0) {
            throw new BadRequestException("Selecciona un equipo válido");
        }
        if (currentUser.tieneVisibilidadGlobalEquipos()) {
            return;
        }
        List<Long> equipos = currentUser.equipos();
        if (equipos == null || !equipos.contains(idEquipo)) {
            throw new ForbiddenException("No tienes acceso para administrar las campañas de este equipo");
        }
    }

    private EquipoCampanaResponse toResponse(Campana campana, Long idEquipoAsignado) {
        return EquipoCampanaResponse.builder()
                .id(campana.getId())
                .nombre(campana.getNombre())
                .activo(campana.getActivo())
                .idProveedor(campana.getProveedor() == null ? null : campana.getProveedor().getId())
                .nombreProveedor(campana.getProveedor() == null ? null : campana.getProveedor().getNombre())
                .idEquipoAsignado(idEquipoAsignado)
                .build();
    }
}
