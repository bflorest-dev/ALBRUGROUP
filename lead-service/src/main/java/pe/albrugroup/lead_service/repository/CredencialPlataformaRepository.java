package pe.albrugroup.lead_service.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import pe.albrugroup.lead_service.entity.CredencialPlataforma;
import pe.albrugroup.lead_service.entity.enums.EstadoCredencialPlataforma;

import java.util.List;

@Repository
public interface CredencialPlataformaRepository extends JpaRepository<CredencialPlataforma, Long> {

    List<CredencialPlataforma> findByPaqueteIdAndEstadoOrderByFechaExpiracionAsc(
            Long idPaquete,
            EstadoCredencialPlataforma estado
    );
}
