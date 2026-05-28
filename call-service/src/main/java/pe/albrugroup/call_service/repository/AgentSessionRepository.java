package pe.albrugroup.call_service.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import pe.albrugroup.call_service.entity.AgentSession;
import pe.albrugroup.call_service.entity.enums.EstadoAgente;

import java.util.List;
import java.util.Optional;

@Repository
public interface AgentSessionRepository extends JpaRepository<AgentSession, Long> {

    /** Sesion activa (logoutAt = null) por extension. */
    Optional<AgentSession> findFirstByExtensionAndLogoutAtIsNullOrderByLoginAtDesc(String extension);

    Optional<AgentSession> findFirstByIdEmpleadoAndLogoutAtIsNullOrderByLoginAtDesc(Long idEmpleado);

    List<AgentSession> findByLogoutAtIsNullAndEstadoActual(EstadoAgente estado);
}
