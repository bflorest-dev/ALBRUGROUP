package pe.albrugroup.lead_service.service;

import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import pe.albrugroup.lead_service.entity.response.ConnectedStatusResponse;
import pe.albrugroup.lead_service.entity.response.ConnectedUserResponse;
import pe.albrugroup.lead_service.presence.EmployeePresence;
import pe.albrugroup.lead_service.presence.PresenceKeys;

import java.util.Comparator;
import java.util.List;
import java.util.Objects;
import java.util.Set;
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

    public List<ConnectedUserResponse> listarUsuariosConectados(String role) {
        Set<String> employeeKeys = obtenerClavesActivas(role);
        if (employeeKeys == null || employeeKeys.isEmpty()) {
            return List.of();
        }

        return employeeKeys.stream()
                .map(key -> presenceRedisTemplate.opsForValue().get(key))
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

    private Set<String> obtenerClavesActivas(String role) {
        if (role == null || role.isBlank()) {
            return stringRedisTemplate.keys(PresenceKeys.employeePattern());
        }

        Set<String> roleKeys = stringRedisTemplate.keys(PresenceKeys.rolePattern(role));
        if (roleKeys == null || roleKeys.isEmpty()) {
            return Set.of();
        }

        return roleKeys.stream()
                .map(this::employeeKeyFromRoleKey)
                .collect(Collectors.toSet());
    }

    private String employeeKeyFromRoleKey(String roleKey) {
        int lastSeparator = roleKey.lastIndexOf(':');
        String employeeId = roleKey.substring(lastSeparator + 1);
        return PresenceKeys.employeeKey(Long.valueOf(employeeId));
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
