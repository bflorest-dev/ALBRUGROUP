package pe.albrugroup.auth_service.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.NonNull;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import pe.albrugroup.auth_service.service.SessionInvalidationService;

import java.io.IOException;
import java.util.stream.Stream;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

@Component
@RequiredArgsConstructor
public class AuthenticationFilter extends OncePerRequestFilter {

    private final JWTUtil jwtUtil;
    private final CustomDetailsService userDetailsService;
    private final SessionInvalidationService sessionInvalidationService;


    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request,
                                    @NonNull HttpServletResponse response,
                                    @NonNull FilterChain filterChain) throws ServletException, IOException
    {
        final String authHeader = request.getHeader("Authorization");
        if(authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        final String jwt = authHeader.substring(7);
        final String username;

        try {
          username = jwtUtil.extractUsername(jwt);

          if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
              UserDetails userDetails = this.userDetailsService.loadUserByUsername(username);
              Long empleadoId = jwtUtil.extractEmpleadoId(jwt);
              Long sessionIssuedAt = jwtUtil.extractSessionIssuedAt(jwt);
              if(jwtUtil.validateToken(jwt, userDetails.getUsername())
                      && !sessionInvalidationService.isInvalidated(empleadoId, sessionIssuedAt)) {
                  var authorities = Stream.concat(
                                  jwtUtil.extractRoles(jwt).stream()
                                          .map(rol -> new SimpleGrantedAuthority("ROLE_" + rol)),
                                  jwtUtil.extractPermisos(jwt).stream()
                                          .map(SimpleGrantedAuthority::new))
                          .toList();
                  UsernamePasswordAuthenticationToken authToken =
                          new UsernamePasswordAuthenticationToken(
                                  userDetails,
                                  null,
                                  authorities);
                  authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                  SecurityContextHolder.getContext().setAuthentication(authToken);
              }
          }
        } catch (Exception e) {
            logger.error("Invalid JWT Token: " + e.getMessage());
        }
        filterChain.doFilter(request, response);
    }
}
