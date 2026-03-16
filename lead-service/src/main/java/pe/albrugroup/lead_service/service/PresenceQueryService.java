package pe.albrugroup.lead_service.service;

import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import pe.albrugroup.lead_service.entity.enums.PuestoTrabajo;
import pe.albrugroup.lead_service.entity.response.ConnectedStatusResponse;
import pe.albrugroup.lead_service.entity.response.ConnectedUserResponse;
import pe.albrugroup.lead_service.presence.EmployeePresence;
import pe.albrugroup.lead_service.presence.PresenceKeys;

import java.util.Comparator;
import java.util.List;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Stream;
import java.util.stream.Collectors;

@Service
public class PresenceQueryService {

    private final RedisTemplate<String, EmployeePresence> presenceRedisTemplate;
    private final StringRedisTemplate stringRedisTemplate;

    public PresenceQueryService(
            RedisTemplate<String, EmployeePresence> presenceRedisTemplate,
            StringRedisTemplate stringRedisTemplate
    ) {
        this.presenceRedisTemplate = presenceRedisTemplate;
        this.stringRedisTemplate = stringRedisTemplate;
    }

    public List<ConnectedUserResponse> listarUsuariosConectados(PuestoTrabajo role) {
        Set<String> employeeIds = obtenerEmpleadoIdsActivos(role);
        if (employeeIds == null || employeeIds.isEmpty()) {
            return List.of();
        }

        List<String> employeeKeys = employeeIds.stream()
                .map(Long::valueOf)
                .map(PresenceKeys::employeeKey)
                .toList();

        List<EmployeePresence> presences = presenceRedisTemplate.opsForValue().multiGet(employeeKeys);
        if (presences == null || presences.isEmpty()) {
            limpiarIndicesHuerfanos(role, employeeIds);
            return List.of();
        }

        Set<String> activeIds = presences.stream()
                .filter(Objects::nonNull)
                .map(EmployeePresence::getEmpleadoId)
                .map(String::valueOf)
                .collect(Collectors.toSet());

        Set<String> staleIds = employeeIds.stream()
                .filter(employeeId -> !activeIds.contains(employeeId))
                .collect(Collectors.toSet());

        limpiarIndicesHuerfanos(role, staleIds);

        return presences.stream()
                .filter(Objects::nonNull)
                .map(this::toResponse)
                .sorted(Comparator.comparing(ConnectedUserResponse::getNombreCompleto, String.CASE_INSENSITIVE_ORDER))
                .toList();
    }

    public ConnectedStatusResponse estaConectado(Long empleadoId) {
        Boolean connected = stringRedisTemplate.hasKey(PresenceKeys.employeeKey(empleadoId));
        return ConnectedStatusResponse.builder()
                .empleadoId(empleadoId)
                .conectado(Boolean.TRUE.equals(connected))
                .build();
    }

    private Set<String> obtenerEmpleadoIdsActivos(PuestoTrabajo role) {
        Set<String> employeeIds = role == null
                ? stringRedisTemplate.opsForSet().members(PresenceKeys.employeeIndexKey())
                : stringRedisTemplate.opsForSet().members(PresenceKeys.roleIndexKey(role.name()));
        return employeeIds == null ? Set.of() : employeeIds;
    }

    private void limpiarIndicesHuerfanos(PuestoTrabajo role, Set<String> staleIds) {
        if (staleIds == null || staleIds.isEmpty()) {
            return;
        }

        stringRedisTemplate.opsForSet().remove(
                PresenceKeys.employeeIndexKey(),
                staleIds.toArray(new String[0])
        );

        if (role != null) {
            stringRedisTemplate.opsForSet().remove(
                    PresenceKeys.roleIndexKey(role.name()),
                    staleIds.toArray(new String[0])
            );
        }
    }

    private ConnectedUserResponse toResponse(EmployeePresence presence) {
        return ConnectedUserResponse.builder()
                .empleadoId(presence.getEmpleadoId())
                .nombreCompleto(presence.getNombreCompleto())
                .roles(presence.getRoles())
                .status(presence.getStatus())
                .lastSeen(presence.getLastSeen())
                .build();
    }
}
