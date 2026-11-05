package pe.albrugroup.lead_service.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.albrugroup.lead_service.configuration.CurrentUser;
import pe.albrugroup.lead_service.entity.Campana;
import pe.albrugroup.lead_service.entity.EquipoCampana;
import pe.albrugroup.lead_service.entity.EquipoProveedor;
import pe.albrugroup.lead_service.entity.request.DistribucionCampanaEquipoRequest;
import pe.albrugroup.lead_service.entity.request.DistribucionCampanasProveedorRequest;
import pe.albrugroup.lead_service.entity.response.EquipoCampanaResponse;
import pe.albrugroup.lead_service.entity.response.ProveedorCampanasEquipoResponse;
import pe.albrugroup.lead_service.exception.BadRequestException;
import pe.albrugroup.lead_service.exception.ForbiddenException;
import pe.albrugroup.lead_service.repository.CampanaRepository;
import pe.albrugroup.lead_service.repository.EquipoCampanaRepository;
import pe.albrugroup.lead_service.repository.EquipoProveedorRepository;

import java.util.Comparator;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
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
        if (campanas.stream().anyMatch(campana -> !Boolean.TRUE.equals(campana.getActivo()))) {
            throw new BadRequestException("No se pueden asignar campañas inactivas");
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

    /**
     * Devuelve una vista de distribución por proveedor. Las campañas son siempre activas; los
     * equipos listados son únicamente los que el usuario puede administrar para ese proveedor.
     */
    @Transactional(readOnly = true)
    public List<ProveedorCampanasEquipoResponse> listarDistribucionesPorProveedor() {
        Map<Long, List<EquipoProveedor>> configuracionesPorProveedor = configuracionesVisibles().stream()
                .filter(configuracion -> configuracion.getProveedor() != null
                        && configuracion.getProveedor().getId() != null)
                .collect(Collectors.groupingBy(
                        configuracion -> configuracion.getProveedor().getId(),
                        LinkedHashMap::new,
                        Collectors.toList()));
        if (configuracionesPorProveedor.isEmpty()) {
            return List.of();
        }

        return configuracionesPorProveedor.entrySet().stream()
                .map(entry -> crearDistribucionProveedor(entry.getKey(), entry.getValue()))
                .sorted(Comparator.comparing(ProveedorCampanasEquipoResponse::getNombreProveedor,
                        Comparator.nullsLast(String.CASE_INSENSITIVE_ORDER)))
                .toList();
    }

    /**
     * PUT de representación completa de un proveedor: todas sus campañas activas deben venir en
     * el request, con un equipo válido o sin equipo. Así no se borran campañas de otro proveedor
     * cuando un mismo equipo trabaja con varios.
     */
    public ProveedorCampanasEquipoResponse actualizarDistribucionProveedor(
            Long idProveedor,
            DistribucionCampanasProveedorRequest request
    ) {
        if (idProveedor == null || idProveedor <= 0) {
            throw new BadRequestException("Selecciona un proveedor válido");
        }
        List<EquipoProveedor> configuracionesProveedor = configuracionesVisibles().stream()
                .filter(configuracion -> configuracion.getProveedor() != null
                        && idProveedor.equals(configuracion.getProveedor().getId()))
                .toList();
        if (configuracionesProveedor.isEmpty()) {
            throw new ForbiddenException("No tienes equipos configurados para este proveedor");
        }

        Set<Long> equiposProveedor = configuracionesProveedor.stream()
                .map(EquipoProveedor::getIdEquipo)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
        List<Campana> campanasActivas = campanaRepository.listarActivasPorProveedorIds(Set.of(idProveedor));
        Set<Long> idsActivos = campanasActivas.stream().map(Campana::getId).collect(Collectors.toSet());
        Map<Long, Long> destinoPorCampana = destinosSolicitados(request);
        if (!destinoPorCampana.keySet().equals(idsActivos)) {
            throw new BadRequestException("La distribución debe incluir exactamente todas las campañas activas del proveedor");
        }

        List<EquipoCampana> asignacionesActuales = idsActivos.isEmpty()
                ? List.of()
                : equipoCampanaRepository.findByCampanaIdIn(idsActivos);
        Map<Long, EquipoCampana> asignacionActualPorCampana = asignacionesActuales.stream()
                .collect(Collectors.toMap(
                        asignacion -> asignacion.getCampana().getId(),
                        asignacion -> asignacion,
                        (primera, ignorada) -> primera));

        for (Campana campana : campanasActivas) {
            EquipoCampana asignacionActual = asignacionActualPorCampana.get(campana.getId());
            Long origen = asignacionActual == null ? null : asignacionActual.getIdEquipo();
            Long destino = destinoPorCampana.get(campana.getId());
            if (Objects.equals(origen, destino)) {
                continue;
            }
            if (origen != null) {
                validarEquipoAdministrable(origen);
            }
            if (destino != null) {
                if (!equiposProveedor.contains(destino)) {
                    throw new BadRequestException("El equipo seleccionado no está configurado para este proveedor");
                }
                validarEquipoAdministrable(destino);
            }
        }

        if (!asignacionesActuales.isEmpty()) {
            equipoCampanaRepository.deleteAllByIdInBatch(asignacionesActuales.stream()
                    .map(EquipoCampana::getId)
                    .toList());
            equipoCampanaRepository.flush();
        }
        for (Campana campana : campanasActivas) {
            Long destino = destinoPorCampana.get(campana.getId());
            if (destino != null) {
                equipoCampanaRepository.save(EquipoCampana.builder()
                        .idEquipo(destino)
                        .campana(campana)
                        .build());
            }
        }

        return crearDistribucionProveedor(idProveedor, configuracionesProveedor);
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

    private Map<Long, Long> destinosSolicitados(DistribucionCampanasProveedorRequest request) {
        if (request == null || request.getAsignaciones() == null) {
            throw new BadRequestException("La distribución de campañas es obligatoria");
        }
        Map<Long, Long> destinos = new LinkedHashMap<>();
        for (DistribucionCampanaEquipoRequest asignacion : request.getAsignaciones()) {
            if (asignacion == null || asignacion.getIdCampana() == null || asignacion.getIdCampana() <= 0) {
                throw new BadRequestException("Una o más campañas no son válidas");
            }
            if (asignacion.getIdEquipo() != null && asignacion.getIdEquipo() <= 0) {
                throw new BadRequestException("Uno o más equipos no son válidos");
            }
            if (destinos.containsKey(asignacion.getIdCampana())) {
                throw new BadRequestException("Una campaña no puede aparecer más de una vez en la distribución");
            }
            destinos.put(asignacion.getIdCampana(), asignacion.getIdEquipo());
        }
        return destinos;
    }

    private ProveedorCampanasEquipoResponse crearDistribucionProveedor(
            Long idProveedor,
            List<EquipoProveedor> configuracionesProveedor
    ) {
        List<Campana> campanas = campanaRepository.listarActivasPorProveedorIds(Set.of(idProveedor));
        Map<Long, Long> equipoPorCampana = equipoCampanaRepository.findByCampanaIdIn(
                        campanas.stream().map(Campana::getId).toList())
                .stream()
                .collect(Collectors.toMap(
                        relacion -> relacion.getCampana().getId(),
                        EquipoCampana::getIdEquipo,
                        (primera, ignorada) -> primera));
        String nombreProveedor = configuracionesProveedor.get(0).getProveedor().getNombre();
        return ProveedorCampanasEquipoResponse.builder()
                .idProveedor(idProveedor)
                .nombreProveedor(nombreProveedor)
                .equipoIds(configuracionesProveedor.stream()
                        .map(EquipoProveedor::getIdEquipo)
                        .filter(Objects::nonNull)
                        .distinct()
                        .sorted()
                        .toList())
                .campanas(campanas.stream()
                        .map(campana -> toResponse(campana, equipoPorCampana.get(campana.getId())))
                        .sorted(Comparator.comparing(EquipoCampanaResponse::getNombre,
                                Comparator.nullsLast(String.CASE_INSENSITIVE_ORDER)))
                        .toList())
                .build();
    }

    private List<EquipoProveedor> configuracionesVisibles() {
        if (currentUser.tieneVisibilidadGlobalEquipos()) {
            return equipoProveedorRepository.findAll();
        }
        List<Long> equipos = currentUser.equipos();
        if (equipos == null || equipos.isEmpty()) {
            return List.of();
        }
        return equipoProveedorRepository.findByIdEquipoIn(equipos);
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
