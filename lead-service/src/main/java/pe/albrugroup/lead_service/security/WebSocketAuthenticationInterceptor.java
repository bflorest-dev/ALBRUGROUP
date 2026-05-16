package pe.albrugroup.lead_service.security;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Stream;

@Component
@Slf4j
@RequiredArgsConstructor
public class WebSocketAuthenticationInterceptor implements ChannelInterceptor {

    private final JWTUtil jwtUtil;

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
        if (accessor == null || accessor.getCommand() != StompCommand.CONNECT) {
            return message;
        }

        String authHeader = accessor.getFirstNativeHeader("Authorization");
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            throw new AccessDeniedException("Token JWT obligatorio para WebSocket");
        }

        String token = authHeader.substring(7);
        try {
            String username = jwtUtil.extractUsername(token);
            Long empleadoId = jwtUtil.extractEmpleadoId(token);
            String nombreCompleto = jwtUtil.extractNombreCompleto(token);
            List<String> roles = jwtUtil.extractRoles(token);
            List<String> permisos = jwtUtil.extractPermisos(token);

            List<SimpleGrantedAuthority> authorities = Stream.concat(
                    roles.stream().map(role -> new SimpleGrantedAuthority("ROLE_" + role)),
                    permisos.stream().map(SimpleGrantedAuthority::new)
            ).toList();

            UserSession userSession = new UserSession(username, empleadoId, nombreCompleto, roles);
            accessor.setUser(new UsernamePasswordAuthenticationToken(userSession, null, authorities));
        } catch (Exception e) {
            log.warn("Conexion WebSocket rechazada por JWT invalido: {}", e.getMessage());
            throw new AccessDeniedException("Token JWT invalido para WebSocket", e);
        }

        return message;
    }
}
