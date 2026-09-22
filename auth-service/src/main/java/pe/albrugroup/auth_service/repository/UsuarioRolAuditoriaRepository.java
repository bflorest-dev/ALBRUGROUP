package pe.albrugroup.auth_service.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import pe.albrugroup.auth_service.entity.UsuarioRolAuditoria;

public interface UsuarioRolAuditoriaRepository extends JpaRepository<UsuarioRolAuditoria, Long> {
    Page<UsuarioRolAuditoria> findByEmpleadoIdOrderByCreatedAtDesc(Long empleadoId, Pageable pageable);
}
