package pe.albrugroup.rrhh_service.security;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;
import pe.albrugroup.rrhh_service.service.EmpresaContratistaScopeService;

import java.util.List;

/**
 * Resuelve el scope de empresa contratista para cada request autenticado y lo almacena
 * en {@link EmpresaContratistaContext} para que los services filtren datos. Fail-closed:
 * un usuario RRHH sin empresas asignadas no ve nada.
 */
@Component
@Slf4j
@RequiredArgsConstructor
public class EmpresaContratistaScopeInterceptor implements HandlerInterceptor {

    private final EmpresaContratistaScopeService scopeService;
    private final EmpresaContratistaContext context;

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof UserSession session)) {
            return true;
        }

        List<String> roles = auth.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .filter(a -> a.startsWith("ROLE_"))
                .map(a -> a.substring(5))
                .toList();

        if (!scopeService.isEmpresaScoped(roles)) {
            return true;
        }

        var scope = scopeService.resolverScope(session.empleadoId(), roles);
        context.setRestringido(scope.restringido());
        context.setEmpresaContratistaId(scope.empresaContratistaId());

        return true;
    }
}
