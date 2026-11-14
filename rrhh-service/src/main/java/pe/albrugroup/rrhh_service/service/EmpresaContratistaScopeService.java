package pe.albrugroup.rrhh_service.service;

import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.albrugroup.rrhh_service.entity.EmpresaContratista;
import pe.albrugroup.rrhh_service.entity.UsuarioEmpresaContratista;
import pe.albrugroup.rrhh_service.exception.BadRequestException;
import pe.albrugroup.rrhh_service.exception.ForbiddenException;
import pe.albrugroup.rrhh_service.repository.EmpresaContratistaRepository;
import pe.albrugroup.rrhh_service.repository.UsuarioEmpresaContratistaRepository;

import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class EmpresaContratistaScopeService {

    public static final String HEADER_EMPRESA = "X-Empresa-Contratista-Id";
    private static final Set<String> ROLES_EMPRESA_SCOPED = Set.of("RRHH");

    private final UsuarioEmpresaContratistaRepository repository;
    private final EmpresaContratistaRepository empresaRepository;
    private final HttpServletRequest request;

    public boolean isEmpresaScoped(List<String> roles) {
        return roles.stream().anyMatch(ROLES_EMPRESA_SCOPED::contains);
    }

    @Transactional(readOnly = true)
    public List<EmpresaContratista> misEmpresas(Long empleadoId, List<String> roles) {
        if (roles.contains("ADMINISTRADOR")) {
            return empresaRepository.findByActivoOrderByNombreAsc(true);
        }
        if (!isEmpresaScoped(roles)) {
            return List.of();
        }
        return empresasAsignadas(empleadoId);
    }

    @Transactional(readOnly = true)
    public ResolvedScope resolverScope(Long empleadoId, List<String> roles) {
        if (!isEmpresaScoped(roles)) {
            return ResolvedScope.sinRestriccion();
        }
        List<EmpresaContratista> asignadas = empresasAsignadas(empleadoId);
        Long activa = empresaActivaHeader();
        if (activa != null) {
            boolean valida = asignadas.stream().anyMatch(e -> activa.equals(e.getId()));
            if (!valida) {
                throw new ForbiddenException("Empresa contratista no asignada al usuario");
            }
            return new ResolvedScope(true, activa);
        }
        if (asignadas.size() == 1) {
            return new ResolvedScope(true, asignadas.getFirst().getId());
        }
        return new ResolvedScope(true, null);
    }

    private List<EmpresaContratista> empresasAsignadas(Long empleadoId) {
        return repository.findByIdEmpleadoAndActivoTrueOrderByEmpresaContratistaNombreAsc(empleadoId)
                .stream()
                .map(UsuarioEmpresaContratista::getEmpresaContratista)
                .toList();
    }

    private Long empresaActivaHeader() {
        String raw = request == null ? null : request.getHeader(HEADER_EMPRESA);
        if (raw == null || raw.isBlank()) {
            return null;
        }
        try {
            return Long.parseLong(raw.trim());
        } catch (NumberFormatException e) {
            throw new BadRequestException("Empresa contratista activa invalida");
        }
    }

    public record ResolvedScope(boolean restringido, Long empresaContratistaId) {
        public static ResolvedScope sinRestriccion() {
            return new ResolvedScope(false, null);
        }
    }
}
