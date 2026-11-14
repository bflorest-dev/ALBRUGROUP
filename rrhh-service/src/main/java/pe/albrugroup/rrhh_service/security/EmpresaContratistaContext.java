package pe.albrugroup.rrhh_service.security;

import lombok.Getter;
import lombok.Setter;
import org.springframework.stereotype.Component;
import org.springframework.web.context.annotation.RequestScope;

/**
 * Scope de empresa contratista resuelto para el request actual.
 * Poblado por {@link EmpresaContratistaScopeInterceptor}, consumido por los services
 * que necesitan acotar datos por empresa contratista (RRHH).
 */
@Component
@RequestScope
@Getter
@Setter
public class EmpresaContratistaContext {

    private boolean restringido;
    private Long empresaContratistaId;

    public static EmpresaContratistaContext sinRestriccion() {
        var ctx = new EmpresaContratistaContext();
        ctx.restringido = false;
        ctx.empresaContratistaId = null;
        return ctx;
    }
}
